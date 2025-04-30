const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, enum: ['client', 'designer', 'admin'], default: 'client' }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
