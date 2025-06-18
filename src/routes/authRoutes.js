const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

const {
    register,
    login,
    resendOtp,
    resetPassword,
    forgotPassword,
    verifyOtp
} = require('../controllers/authController')

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/resend-otp', resendOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
