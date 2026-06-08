const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create the user schema without indexes first
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Add email index manually with unique constraint
userSchema.index({ email: 1 }, { unique: true });

// Hash before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
