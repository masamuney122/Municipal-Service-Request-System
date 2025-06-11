const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { auth, isAdmin, isStaff } = require('../middleware/auth');

// Get dashboard statistics
router.get('/dashboard', auth, isStaff, async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      resolvedRequests,
      rejectedRequests,
      totalUsers,
      recentRequests
    ] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'in-progress' }),
      ServiceRequest.countDocuments({ status: 'resolved' }),
      ServiceRequest.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'citizen' }),
      ServiceRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('citizen', 'firstName lastName email')
    ]);

    // Get requests by category
    const requestsByCategory = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average resolution time
    const resolvedRequestsWithTime = await ServiceRequest.find({
      status: 'resolved',
      actualCompletionDate: { $exists: true }
    });

    const avgResolutionTime = resolvedRequestsWithTime.reduce((acc, request) => {
      const resolutionTime = request.actualCompletionDate - request.createdAt;
      return acc + resolutionTime;
    }, 0) / (resolvedRequestsWithTime.length || 1);

    res.json({
      statistics: {
        totalRequests,
        pendingRequests,
        inProgressRequests,
        resolvedRequests,
        rejectedRequests,
        totalUsers,
        requestsByCategory,
        avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)) // Convert to hours
      },
      recentRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error1' });
  }
});

// Get all service requests (with filtering and pagination)
router.get('/requests', auth, isStaff, async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const requests = await ServiceRequest.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('citizen', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    const total = await ServiceRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error2' });
  }
});

// Assign staff to service request
router.post('/requests/:id/assign', auth, isAdmin, [
  body('staffId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { staffId } = req.body;
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.assignedTo = staffId;
    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error3' });
  }
});

// Generate report
router.get('/reports', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (category) query.category = category;

    const requests = await ServiceRequest.find(query)
      .populate('citizen', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    // Calculate metrics
    const metrics = {
      totalRequests: requests.length,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      avgResolutionTime: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    requests.forEach(request => {
      // Count by status
      metrics.byStatus[request.status] = (metrics.byStatus[request.status] || 0) + 1;
      
      // Count by category
      metrics.byCategory[request.category] = (metrics.byCategory[request.category] || 0) + 1;
      
      // Count by priority
      metrics.byPriority[request.priority] = (metrics.byPriority[request.priority] || 0) + 1;

      // Calculate resolution time
      if (request.status === 'resolved' && request.actualCompletionDate) {
        const resolutionTime = request.actualCompletionDate - request.createdAt;
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    metrics.avgResolutionTime = resolvedCount > 0 
      ? Math.round(totalResolutionTime / (resolvedCount * 1000 * 60 * 60)) // Convert to hours
      : 0;

    res.json({
      metrics,
      requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error4' });
  }
});

// Get staff performance metrics
router.get('/staff-performance', auth, isAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' });
    const performance = await Promise.all(staff.map(async (member) => {
      const assignedRequests = await ServiceRequest.find({ assignedTo: member._id });
      const resolvedRequests = assignedRequests.filter(req => req.status === 'resolved');
      
      const avgResolutionTime = resolvedRequests.reduce((acc, req) => {
        if (req.actualCompletionDate) {
          return acc + (req.actualCompletionDate - req.createdAt);
        }
        return acc;
      }, 0) / (resolvedRequests.length || 1);

      return {
        staff: {
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email
        },
        metrics: {
          totalAssigned: assignedRequests.length,
          resolved: resolvedRequests.length,
          pending: assignedRequests.filter(req => req.status === 'pending').length,
          inProgress: assignedRequests.filter(req => req.status === 'in-progress').length,
          avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)) // Convert to hours
        }
      };
    }));

    res.json(performance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error5' });
  }
});

module.exports = router; 