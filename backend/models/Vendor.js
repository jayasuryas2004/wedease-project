const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  priceRange: String,
  location: String,
  imageUrl: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', vendorSchema);
