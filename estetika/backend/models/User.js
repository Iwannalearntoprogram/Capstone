const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  userType: { type: String, enum: ['admin', 'designer', 'client'], default: 'client' },
  createdAt: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiresAt: { type: Date }
});


module.exports = mongoose.model('User', userSchema);
