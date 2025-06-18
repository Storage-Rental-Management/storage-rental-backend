const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
    unique: false,
  },
  password: {
    type: String,
    required: false,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: false,
  },
  authProvider: {
    type: String,
    default: 'local',
  },
  authProviderId: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: 'Active',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  profileImage: {
    type: String, 
    default: '', 
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
