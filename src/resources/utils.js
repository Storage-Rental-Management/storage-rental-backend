const Otp = require('../models/otp');
const jwt = require('jsonwebtoken');

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

const generateToken = (payload, role) => {
    const updatedPayload = {
        ...payload,
        role: role,
    };
    return jwt.sign(updatedPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
  generateOtp,
  generateToken,
  createAndSendOtp
};