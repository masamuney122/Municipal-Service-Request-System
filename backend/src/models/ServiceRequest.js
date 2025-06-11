const mongoose = require('mongoose');
const { emitToAdmin, emitToUser } = require('../socket');
const DashboardStats = require('./DashboardStats');

// Define estimated response times (in hours) for each category
const categoryResponseTimes = {
  maintenance: 48,    // 2 days
  repair: 24,        // 1 day
  installation: 72,   // 3 days
  inspection: 48,     // 2 days
  streetlight: 24,    // 1 day
  other: 72          // 3 days
};

const serviceRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['maintenance', 'repair', 'installation', 'inspection', 'streetlight', 'other']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  estimatedResponseTime: {
    type: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    },
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      }
    }
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: String,
    enum: ['Water Works Association', 'Electric Association', 'Gas Association', 'Parks and Recreation', 'Municipality', 'Governorship', 'Ministry of Environment Urbanization and Climate Change', 'Ministry of Transport and Infrastructure', 'Ministry of the Interior', 'Ministry of Health', 'Other'],
    required: false
  },
  statusComment: {
    type: String,
    default: ''
  },
  statusHistory: [{
    status: {
      type: String,
      required: true,
      enum: ['pending', 'in-progress', 'resolved', 'rejected']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: false
  },
  url: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: false
  },
  mimetype: {
    type: String
  },
  originalname: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
  }],
  actualCompletionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add index for location queries
serviceRequestSchema.index({ 'location': '2dsphere' });

// Pre-save middleware to set estimated response time
serviceRequestSchema.pre('save', function(next) {
  if (this.isNew) {
    const responseTimeHours = categoryResponseTimes[this.category] || 72;
    this.estimatedResponseTime = new Date(Date.now() + responseTimeHours * 60 * 60 * 1000);
  }
  next();
});

// Method to send notification to admin
serviceRequestSchema.methods.notifyAdmin = async function(userData) {
  const notification = {
    type: 'NEW_REQUEST',
    requestId: this._id,
    title: 'New Service Request',
    message: `A new service request "${this.title}" has been submitted by ${userData.name}`,
    status: this.status,
    updatedBy: {
      _id: userData._id,
      name: userData.name
    },
    timestamp: new Date()
  };

  emitToAdmin('notification', notification);
};

// Method to send notification to user
serviceRequestSchema.methods.notifyUser = async function(type, title, message, updatedBy) {
  const notification = {
    type,
    requestId: this._id,
    title,
    message,
    status: this.status,
    updatedBy: {
      _id: updatedBy._id,
      name: updatedBy.name
    },
    timestamp: new Date()
  };

  emitToUser(this.citizen, 'notification', notification);
};

// Method to update dashboard stats
serviceRequestSchema.methods.updateDashboardStats = async function(oldStatus) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let stats = await DashboardStats.findOne({ 
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      } 
    });

    if (!stats) {
      stats = new DashboardStats({ date: today });
    }

    // Update request status counts
    if (oldStatus) {
      stats.requestsByStatus[oldStatus] = Math.max(0, (stats.requestsByStatus[oldStatus] || 0) - 1);
    }
    stats.requestsByStatus[this.status] = (stats.requestsByStatus[this.status] || 0) + 1;

    // Update response and resolution times
    if (this.status === 'in-progress' && oldStatus === 'pending') {
      // Calculate response time in hours
      const responseTime = (new Date() - this.createdAt) / (1000 * 60 * 60);
      const currentTotal = stats.responseTimes.average * stats.totalRequests;
      stats.responseTimes.average = (currentTotal + responseTime) / (stats.totalRequests + 1);
      stats.responseTimes.byCategory[this.category] = responseTime;
    }

    if (this.status === 'resolved') {
      // Calculate resolution time in hours
      const resolutionTime = (new Date() - this.createdAt) / (1000 * 60 * 60);
      const currentTotal = stats.resolutionTimes.average * stats.totalRequests;
      stats.resolutionTimes.average = (currentTotal + resolutionTime) / (stats.totalRequests + 1);
      stats.resolutionTimes.byCategory[this.category] = resolutionTime;
    }

    await stats.save();
  } catch (error) {
    console.error('Error updating dashboard stats:', error);
  }
};

// Method to update status and send notifications
serviceRequestSchema.methods.updateStatus = async function(newStatus, updatedBy, comment) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    changedBy: updatedBy._id,
    comment: comment || `Status changed to ${newStatus}`,
    timestamp: new Date()
  });

  // Update dashboard stats
  await this.updateDashboardStats(oldStatus);

  // If resolved, set actual completion date
  if (newStatus === 'resolved') {
    this.actualCompletionDate = new Date();
  }

  // Save the changes
  await this.save();

  // Prepare notification
  const notification = {
    type: 'STATUS_UPDATE',
    requestId: this._id,
    title: 'Request Status Updated',
    message: `Request "${this.title}" status has been updated to ${newStatus}${comment ? ': ' + comment : ''}`,
    status: newStatus,
    updatedBy: {
      _id: updatedBy._id,
      name: updatedBy.name
    },
    timestamp: new Date()
  };

  // Notify user
  await this.notifyUser('STATUS_UPDATE', notification.title, notification.message, updatedBy);
};

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest; 