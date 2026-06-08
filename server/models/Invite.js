const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  coupleName: { type: String, required: true },
  theme: String,
  venue: String,
  date: String,
  time: String,
  style: String,
  imageUrl: String,
  usedFallback: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, { timestamps: true });

module.exports = mongoose.model('Invite', inviteSchema);
