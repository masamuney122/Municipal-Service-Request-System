const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ServiceRequest = require('../models/ServiceRequest');
const { auth, isAdmin } = require('../middleware/auth');
const { emitNotification } = require('../socket');

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Validation middleware
const requestValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['maintenance', 'repair', 'installation', 'inspection', 'streetlight', 'other'])
    .withMessage('Invalid category'),
  body('location.coordinates').optional().isArray().withMessage('Coordinates must be an array')
    .custom((value) => {
      if (!value) return true;
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('Coordinates must be an array of two numbers');
      }
      if (typeof value[0] !== 'number' && typeof value[1] !== 'number') {
        throw new Error('Coordinates must be numbers');
      }
      return true;
    }),
  body('location.address').optional().isObject().withMessage('Address must be an object'),
  body('location.address.street').optional().trim(),
  body('location.address.city').optional().trim(),
  body('location.address.state').optional().trim(),
  body('location.address.zipCode').optional().trim()
];

// Create new service request
router.post('/', auth, upload.array('attachments', 5), requestValidation, async (req, res) => {
  try {
    // location.coordinates string ise, array olarak parse et
    if (req.body.location && req.body.location.coordinates && typeof req.body.location.coordinates === 'string') {
      try {
        req.body.location.coordinates = JSON.parse(req.body.location.coordinates);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid coordinates format' });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { title, description, category, location } = req.body;
    const attachments = [];

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      attachments.push(...req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      })));
    }

    // Create service request with optional location
    const serviceRequestData = {
      title: title.trim(),
      description: description.trim(),
      category,
      attachments,
      citizen: req.user._id
    };

    // Add location if provided
    if (location) {
      serviceRequestData.location = {
        coordinates: location.coordinates || [0, 0],
        address: {
          street: location.address?.street?.trim() || '',
          city: location.address?.city?.trim() || '',
          state: location.address?.state?.trim() || '',
          zipCode: location.address?.zipCode?.trim() || ''
        }
      };
    }

    console.log('Creating service request with data:', serviceRequestData);

    const serviceRequest = new ServiceRequest(serviceRequestData);
    await serviceRequest.save();
    console.log('Service request saved successfully:', serviceRequest);

    // Add initial status history
    serviceRequest.statusHistory.push({
      status: 'pending',
      changedBy: req.user._id,
      comment: 'Request created'
    });

    await serviceRequest.save();
    console.log('Status history added successfully');

    // Send notification to all admins
    const notification = {
      type: 'NEW_REQUEST',
      requestId: serviceRequest._id,
      title: 'New Service Request',
      message: `A new service request "${serviceRequest.title}" has been submitted by ${req.user.name}`,
      status: serviceRequest.status,
      updatedBy: {
        _id: req.user._id,
        name: req.user.name
      },
      timestamp: new Date()
    };

    emitNotification(notification);
    console.log('Sent notification to admins:', notification);

    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Request creation error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      validationErrors: error.errors
    });
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed',
        error: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate request',
        error: 'A request with this title already exists'
      });
    }

    res.status(500).json({ 
      message: 'Failed to create service request',
      error: error.message 
    });
  }
});

// Get all service requests for a citizen
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ citizen: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'firstName lastName email');
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get service request by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is authorized to view this request
    if (request.citizen._id.toString() !== req.user._id.toString() && req.user.role === 'citizen') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Populate the user information in the response
    const populatedRequest = await ServiceRequest.findById(request._id)
      .populate('comments.user', 'name email role')
      .populate('citizen', 'name email role')
      .populate('statusHistory.changedBy', 'name email role');

    res.json(populatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to service request
router.post('/:id/comments', auth, [
  body('text').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.comments.push({
      user: req.user._id,
      text: req.body.text
    });

    await request.save();

    // Populate the user information in the response
    const populatedRequest = await ServiceRequest.findById(request._id)
      .populate('comments.user', 'name email role')
      .populate('citizen', 'name email role')
      .populate('statusHistory.changedBy', 'name email role');

    res.json(populatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service request status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    if (!['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ServiceRequest.findById(req.params.id)
      .populate('citizen', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const oldStatus = request.status;
    request.status = status;

    // Add to status history
    request.statusHistory.push({
      status,
      changedBy: req.user._id,
      comment: comment || `Status changed from ${oldStatus} to ${status}`,
      timestamp: new Date()
    });

    await request.save();

    // Send notification to the request owner
    const notification = {
      type: 'STATUS_UPDATE',
      requestId: request._id,
      userId: request.citizen._id,
      title: 'Request Status Updated',
      message: `Your request "${request.title}" status has been updated to ${status}`,
      status: status,
      comment: comment || `Status changed from ${oldStatus} to ${status}`,
      updatedBy: {
        _id: req.user._id,
        name: req.user.name
      },
      timestamp: new Date()
    };

    emitNotification(notification);
    console.log('Sent notification to user:', notification);

    res.json(request);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby service requests
router.get('/nearby', auth, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query; // maxDistance in meters

    const requests = await ServiceRequest.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('citizen', 'firstName lastName');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service request (admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update requests' });
    }

    const request = await ServiceRequest.findById(id)
      .populate('citizen', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update request fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'citizen') {
        request[key] = updates[key];
      }
    });

    // Add status history if status is updated
    if (updates.status) {
      request.statusHistory.push({
        status: updates.status,
        changedBy: req.user._id,
        comment: updates.statusComment || 'Status updated',
        timestamp: new Date()
      });

      // Send status update notification
      const statusNotification = {
        type: 'STATUS_UPDATE',
        requestId: request._id,
        userId: request.citizen._id,
        title: 'Request Status Updated',
        message: `Your request "${request.title}" status has been updated to ${updates.status}`,
        status: updates.status,
        comment: updates.statusComment || 'Status updated',
        updatedBy: {
          _id: req.user._id,
          name: req.user.name
        },
        timestamp: new Date()
      };

      // Emit notification to all users and specifically to the request owner
      emitNotification(statusNotification);
      console.log('Sent status notification:', statusNotification);
    }

    // If department is being assigned, send notification
    if (updates.assignedTo) {
      const deptNotification = {
        type: 'DEPARTMENT_ASSIGNED',
        requestId: request._id,
        userId: request.citizen._id,
        title: 'Request Assigned to Department',
        message: `Your request "${request.title}" has been assigned to ${updates.assignedTo}`,
        status: request.status,
        updatedBy: {
          _id: req.user._id,
          name: req.user.name
        },
        timestamp: new Date()
      };

      // Emit notification to all users and specifically to the request owner
      emitNotification(deptNotification);
      console.log('Sent department notification:', deptNotification);
    }

    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all requests for admin
router.get('/admin/requests', auth, isAdmin, async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate('citizen', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 