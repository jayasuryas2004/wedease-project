const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['venue', 'photography', 'makeup', 'decor', 'catering'],
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    packages: [{
      name: String,
      description: String,
      price: Number,
      includes: [String]
    }]
  },
  images: [{
    url: String,
    caption: String
  }],
  availability: [{
    date: Date,
    timeSlots: [{
      start: String,
      end: String,
      isBooked: {
        type: Boolean,
        default: false
      }
    }]
  }],
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'approved'
  },
  services: [{
    type: String
  }],
  businessInfo: {
    yearsInBusiness: Number,
    gstNumber: String,
    panNumber: String,
    businessType: String,
    teamSize: Number
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate average rating and total reviews before saving
vendorSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  this.updatedAt = Date.now();
  next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
