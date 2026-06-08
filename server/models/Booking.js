const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  time: {
    start: {
      type: String,
      required: [true, 'Start time is required']
    },
    end: {
      type: String,
      required: [true, 'End time is required']
    }
  },
  package: {
    name: String,
    price: Number
  },
  customRequests: {
    type: String
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid'],
    default: 'unpaid'
  },
  paymentDetails: {
    method: String,
    transactionId: String,
    paidAmount: Number,
    paidDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
