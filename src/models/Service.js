import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'transport',
      'food-delivery',
      'grocery-delivery',
      'pharmacy',
      'laundry',
      'cleaning',
      'beauty',
      'fitness',
      'education',
      'entertainment',
      'shopping',
      'repair',
      'pet-care',
      'healthcare',
      'financial',
      'legal',
      'real-estate',
      'travel',
      'events',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  icon: {
    type: String,
    required: true
  },
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    },
    pricingModel: {
      type: String,
      enum: ['fixed', 'hourly', 'distance-based', 'dynamic'],
      default: 'fixed'
    },
    minimumOrder: {
      type: Number,
      default: 0
    },
    maximumOrder: {
      type: Number
    },
    surcharges: [{
      name: String,
      amount: Number,
      condition: String
    }],
    discounts: [{
      name: String,
      percentage: Number,
      minimumAmount: Number,
      validUntil: Date
    }]
  },
  
  // Availability
  availability: {
    isActive: {
      type: Boolean,
      default: true
    },
    operatingHours: {
      monday: { open: String, close: String, isOpen: Boolean },
      tuesday: { open: String, close: String, isOpen: Boolean },
      wednesday: { open: String, close: String, isOpen: Boolean },
      thursday: { open: String, close: String, isOpen: Boolean },
      friday: { open: String, close: String, isOpen: Boolean },
      saturday: { open: String, close: String, isOpen: Boolean },
      sunday: { open: String, close: String, isOpen: Boolean }
    },
    timeSlots: [{
      startTime: String,
      endTime: String,
      maxBookings: Number
    }],
    leadTime: {
      type: Number, // minutes
      default: 30
    },
    maxAdvanceBooking: {
      type: Number, // days
      default: 30
    }
  },
  
  // Service Area
  serviceArea: {
    type: {
      type: String,
      enum: ['radius', 'polygon', 'city', 'country'],
      default: 'radius'
    },
    radius: {
      type: Number, // kilometers
      default: 10
    },
    coordinates: [{
      latitude: Number,
      longitude: Number
    }],
    cities: [String],
    countries: [String]
  },
  
  // Requirements
  requirements: {
    minimumAge: {
      type: Number,
      default: 18
    },
    documents: [String],
    skills: [String],
    certifications: [String],
    experience: {
      type: Number, // years
      default: 0
    }
  },
  
  // Features
  features: [{
    name: String,
    description: String,
    isIncluded: {
      type: Boolean,
      default: true
    },
    additionalCost: {
      type: Number,
      default: 0
    }
  }],
  
  // Ratings and Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total: {
      type: Number,
      default: 0
    },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  
  // Statistics
  stats: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 }, // minutes
    cancellationRate: { type: Number, default: 0 }, // percentage
    repeatCustomerRate: { type: Number, default: 0 } // percentage
  },
  
  // Service Provider
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tags and Search
  tags: [String],
  keywords: [String],
  
  // Settings
  settings: {
    autoAccept: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    allowCancellation: {
      type: Boolean,
      default: true
    },
    cancellationWindow: {
      type: Number, // hours
      default: 24
    },
    allowRescheduling: {
      type: Boolean,
      default: true
    },
    reschedulingWindow: {
      type: Number, // hours
      default: 2
    }
  },
  
  // Metadata
  metadata: {
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
    featured: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ 'ratings.average': -1 });
serviceSchema.index({ 'stats.totalBookings': -1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ 'serviceArea.coordinates': '2dsphere' });
serviceSchema.index({ featured: 1, priority: -1 });

// Virtual for rating percentage
serviceSchema.virtual('ratingPercentage').get(function() {
  if (this.ratings.total === 0) return 0;
  return (this.ratings.average / 5) * 100;
});

// Virtual for availability status
serviceSchema.virtual('isCurrentlyAvailable').get(function() {
  if (!this.availability.isActive) return false;
  
  const now = new Date();
  const dayOfWeek = now.toLocaleLowerCase().slice(0, 3);
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todaySchedule = this.availability.operatingHours[dayOfWeek];
  if (!todaySchedule || !todaySchedule.isOpen) return false;
  
  return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
});

// Pre-save middleware to update metadata
serviceSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

// Static method to find active services
serviceSchema.statics.findActive = function() {
  return this.find({ 'availability.isActive': true });
};

// Static method to find by category
serviceSchema.statics.findByCategory = function(category) {
  return this.find({ category, 'availability.isActive': true });
};

// Static method to find nearby services
serviceSchema.statics.findNearby = function(latitude, longitude, maxDistance = 10) {
  return this.find({
    'availability.isActive': true,
    'serviceArea.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert to meters
      }
    }
  });
};

// Static method to find featured services
serviceSchema.statics.findFeatured = function() {
  return this.find({
    'availability.isActive': true,
    'metadata.featured': true
  }).sort({ 'metadata.priority': -1 });
};

// Instance method to update rating
serviceSchema.methods.updateRating = function(newRating) {
  const oldTotal = this.ratings.total;
  const oldAverage = this.ratings.average;
  
  this.ratings.total += 1;
  this.ratings.average = ((oldAverage * oldTotal) + newRating) / this.ratings.total;
  
  // Update distribution
  const ratingKey = Math.floor(newRating).toString();
  if (this.ratings.distribution[ratingKey] !== undefined) {
    this.ratings.distribution[ratingKey] += 1;
  }
  
  return this.save();
};

// Instance method to calculate completion time
serviceSchema.methods.updateCompletionTime = function(completionTime) {
  const oldTotal = this.stats.totalBookings;
  const oldAverage = this.stats.averageCompletionTime;
  
  this.stats.averageCompletionTime = ((oldAverage * oldTotal) + completionTime) / (oldTotal + 1);
  
  return this.save();
};

const Service = mongoose.model('Service', serviceSchema);

export default Service; 