const ServiceRequest = require('../models/ServiceRequest');
const DashboardStats = require('../models/DashboardStats');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's stats
    let stats = await DashboardStats.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!stats) {
      stats = new DashboardStats({ date: today });
      await stats.save();
    }

    // Get historical trends (last 7 days)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trends = await DashboardStats.find({
      date: {
        $gte: sevenDaysAgo,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ date: 1 });

    // Calculate averages for the week
    const weeklyStats = trends.reduce((acc, day) => {
      acc.responseTimes.push({
        date: day.date,
        average: day.responseTimes.average,
        byCategory: day.responseTimes.byCategory
      });
      acc.resolutionTimes.push({
        date: day.date,
        average: day.resolutionTimes.average,
        byCategory: day.resolutionTimes.byCategory
      });
      acc.requestsByStatus.push({
        date: day.date,
        counts: day.requestsByStatus
      });
      return acc;
    }, {
      responseTimes: [],
      resolutionTimes: [],
      requestsByStatus: []
    });

    res.json({
      currentStats: {
        totalRequests: stats.totalRequests,
        requestsByStatus: stats.requestsByStatus,
        requestsByCategory: stats.requestsByCategory,
        averageResponseTime: stats.responseTimes.average,
        averageResolutionTime: stats.resolutionTimes.average,
        responseTimesByCategory: stats.responseTimes.byCategory,
        resolutionTimesByCategory: stats.resolutionTimes.byCategory
      },
      trends: weeklyStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
}; 