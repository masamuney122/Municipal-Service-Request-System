const mongoose = require('mongoose');

const dashboardStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  requestsByStatus: {
    pending: { type: Number, default: 0 },
    'in-progress': { type: Number, default: 0 },
    resolved: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 }
  },
  requestsByCategory: {
    maintenance: { type: Number, default: 0 },
    repair: { type: Number, default: 0 },
    installation: { type: Number, default: 0 },
    inspection: { type: Number, default: 0 },
    streetlight: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  responseTimes: {
    // Time between request creation and first status change to 'in-progress'
    average: { type: Number, default: 0 }, // in hours
    byCategory: {
      maintenance: { type: Number, default: 0 },
      repair: { type: Number, default: 0 },
      installation: { type: Number, default: 0 },
      inspection: { type: Number, default: 0 },
      streetlight: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  resolutionTimes: {
    // Time between request creation and status change to 'resolved'
    average: { type: Number, default: 0 }, // in hours
    byCategory: {
      maintenance: { type: Number, default: 0 },
      repair: { type: Number, default: 0 },
      installation: { type: Number, default: 0 },
      inspection: { type: Number, default: 0 },
      streetlight: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Create a compound index on date field
dashboardStatsSchema.index({ date: 1 });

const DashboardStats = mongoose.model('DashboardStats', dashboardStatsSchema);

module.exports = DashboardStats; 