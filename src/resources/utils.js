const Otp = require('../models/otp');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Counter = require('../models/counter');

const generateCode = async (prefix) => {
  try {
    // Find and update the counter
    const counter = await Counter.findOneAndUpdate(
      { name: prefix },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    // Generate the code with leading zeros
    const code = `${prefix}-${counter.count.toString().padStart(5, '0')}`;
    return code;
  } catch (error) {
    console.error(`Error generating ${prefix} code:`, error);
    throw error;
  }
};

const generateOtp = () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    return { otpCode, otpExpiry };
};

const createAndSendOtp = async (email) => {
  try {
    const otp = exports.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    console.log(`🔐 OTP for ${email}: ${otp}`);
    return otp;
  } catch (error) {
    throw new Error('Failed to create and send OTP');
  }
};

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role?.name || 'User', // fallback if role is not populated
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const getMonth = (paymentMonth) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthIndex = paymentMonth
    ? monthNames.indexOf(paymentMonth)
    : new Date().getMonth();

  if (monthIndex === -1) {
    throw new Error("Invalid month name");
  }
  return monthIndex;
}

const safeStringify = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle ObjectIds
  if (value._id || (typeof value === 'object' && value.toString().match(/^[0-9a-fA-F]{24}$/))) {
    return value.toString();
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Handle primitives
  return String(value);
}


module.exports = {
  generateOtp,
  generateToken,
  createAndSendOtp,
  generateCode,
  formatDate,
  getMonth,
  safeStringify,
};