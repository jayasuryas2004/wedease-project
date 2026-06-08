const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, required: false },  // This will store the image file path
  message: { type: String, required: true },
}, { timestamps: true });  // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Invite', inviteSchema);
