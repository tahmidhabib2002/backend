const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Admin/User profile name is required'], trim: true },
  email: { type: String, required: [true, 'Admin email is mandatory'], unique: true, lowercase: true, trim: true },
  googleId: { type: String, default: null },
  password: { type: String, default: null },
  role: { type: String, enum: ['Super Admin', 'Admin', 'Editor'], default: 'Editor' },
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Date }
}, { timestamps: true });

userSchema.index({ email: 1 });
module.exports = mongoose.model('User', userSchema);