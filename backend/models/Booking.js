const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: String,
  vendorId: String,
  date: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
