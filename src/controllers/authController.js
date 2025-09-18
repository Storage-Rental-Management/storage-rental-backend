const registerService = require('../services/auth/registerService');
const loginService = require('../services/auth/loginService');
const getUserService = require('../services/auth/getUserService');
const socialLoginService = require('../services/auth/socialLoginService');
const verifyOtpService = require('../services/auth/verifyOtpService');
const resetPasswordService = require('../services/auth/resetPasswordService');
const resendOtpService = require('../services/auth/resendOtpService');
const forgotPasswordService = require('../services/auth/forgotPasswordService');


//  Register
const register = async (req, res) => {
    try {
        await registerService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

//  Login
const login = async (req, res) => {
    try {
        const token = await loginService(req, res);
        res.json({ token });
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

//  Social Login
const socialLogin = async (req, res) => {
    try {
        await socialLoginService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        await verifyOtpService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        await resetPasswordService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Resend OTP
const resendOtp = async (req, res) => {
    try {
        await resendOtpService(req, res);
    } catch (error) {
        logError(error);
        return res.internalServerError({ message: error.message });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        await forgotPasswordService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get User Details
const getUser = async (req, res) => {
    try {
        await getUserService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resetPassword,
  resendOtp,
  forgotPassword,
  socialLogin,
  getUser
};
