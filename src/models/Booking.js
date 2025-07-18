import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // Basic Information
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  runner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Booking Details
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: Number, // minutes
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Location Information
  pickupLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: String
  },
  deliveryLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: String
  },
  
  // Service Details
  serviceDetails: {
    quantity: {
      type: Number,
      default: 1
    },
    customRequirements: String,
    specialInstructions: String,
    items: [{
      name: String,
      quantity: Number,
      price: Number,
      description: String
    }]
  },
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    surcharges: [{
      name: String,
      amount: Number,
      reason: String
    }],
    discounts: [{
      name: String,
      amount: Number,
      type: String // percentage or fixed
    }],
    tax: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['card', 'cash', 'wallet', 'paypal', 'apple-pay', 'google-pay'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially-refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentDate: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundDate: Date
  },
  
  // Status Tracking
  status: {
    current: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'assigned',
        'in-progress',
        'completed',
        'cancelled',
        'failed',
        'disputed'
      ],
      default: 'pending'
    },
    history: [{
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    }]
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tracking
  tracking: {
    currentLocation: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      timestamp: Date,
      address: String
    },
    route: [{
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      timestamp: Date,
      speed: Number,
      heading: Number
    }],
    estimatedArrival: Date,
    actualArrival: Date
  },
  
  // Reviews and Ratings
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date,
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  
  // Cancellation
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed', 'failed'],
      default: 'pending'
    }
  },
  
  // Dispute
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    reason: String,
    evidence: [String],
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push', 'in-app']
    },
    title: String,
    message: String,
    sentAt: Date,
    isRead: Boolean,
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    appVersion: String,
    bookingSource: {
      type: String,
      enum: ['web', 'mobile-app', 'phone', 'partner'],
      default: 'mobile-app'
    },
    referralCode: String,
    campaign: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ service: 1 });
bookingSchema.index({ provider: 1 });
bookingSchema.index({ runner: 1 });
bookingSchema.index({ 'status.current': 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'payment.transactionId': 1 });

// Virtual for total surcharges
bookingSchema.virtual('totalSurcharges').get(function() {
  return this.pricing.surcharges.reduce((sum, surcharge) => sum + surcharge.amount, 0);
});

// Virtual for total discounts
bookingSchema.virtual('totalDiscounts').get(function() {
  return this.pricing.discounts.reduce((sum, discount) => sum + discount.amount, 0);
});

// Virtual for actual duration
bookingSchema.virtual('actualDuration').get(function() {
  if (!this.actualStartTime || !this.actualEndTime) return null;
  return (this.actualEndTime - this.actualStartTime) / (1000 * 60); // minutes
});

// Virtual for status duration
bookingSchema.virtual('statusDuration').get(function() {
  const currentStatus = this.status.history[this.status.history.length - 1];
  if (!currentStatus) return null;
  return (Date.now() - currentStatus.timestamp) / (1000 * 60); // minutes
});

// Pre-save middleware to generate booking ID
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    this.bookingId = this.generateBookingId();
  }
  next();
});

// Pre-save middleware to update status history
bookingSchema.pre('save', function(next) {
  if (this.isModified('status.current')) {
    this.status.history.push({
      status: this.status.current,
      timestamp: new Date(),
      updatedBy: this.user // This will be updated in the controller
    });
  }
  next();
});

// Instance method to generate booking ID
bookingSchema.methods.generateBookingId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `MC${timestamp.slice(-6)}${random}`;
};

// Instance method to update status
bookingSchema.methods.updateStatus = function(newStatus, updatedBy, notes = '') {
  this.status.current = newStatus;
  this.status.history.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    notes: notes
  });
  return this.save();
};

// Instance method to add message
bookingSchema.methods.addMessage = function(sender, message) {
  this.messages.push({
    sender: sender,
    message: message,
    timestamp: new Date(),
    isRead: false
  });
  return this.save();
};

// Instance method to update tracking
bookingSchema.methods.updateTracking = function(latitude, longitude, address = '') {
  this.tracking.currentLocation = {
    coordinates: { latitude, longitude },
    timestamp: new Date(),
    address: address
  };
  this.tracking.route.push({
    coordinates: { latitude, longitude },
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to cancel booking
bookingSchema.methods.cancelBooking = function(cancelledBy, reason, refundAmount = 0) {
  this.cancellation = {
    isCancelled: true,
    cancelledBy: cancelledBy,
    cancelledAt: new Date(),
    reason: reason,
    refundAmount: refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : 'completed'
  };
  this.status.current = 'cancelled';
  return this.save();
};

// Instance method to add review
bookingSchema.methods.addReview = function(rating, comment, isPublic = true) {
  this.review = {
    rating: rating,
    comment: comment,
    submittedAt: new Date(),
    isPublic: isPublic
  };
  return this.save();
};

// Static method to find by booking ID
bookingSchema.statics.findByBookingId = function(bookingId) {
  return this.findOne({ bookingId });
};

// Static method to find user bookings
bookingSchema.statics.findUserBookings = function(userId, status = null) {
  const query = { user: userId };
  if (status) query['status.current'] = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find provider bookings
bookingSchema.statics.findProviderBookings = function(providerId, status = null) {
  const query = { provider: providerId };
  if (status) query['status.current'] = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find today's bookings
bookingSchema.statics.findTodayBookings = function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  return this.find({
    scheduledDate: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  });
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking; 