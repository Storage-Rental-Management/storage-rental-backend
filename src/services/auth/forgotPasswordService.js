const User = require('../../models/user');
const Otp = require('../../models/otp'); // Add this import
const { generateOtp } = require('../../resources/utils');
const { sendOtpEmail } = require('../../resources/emailUtils');
const { forgotPasswordSchema } = require('../../validation/authValidation');

module.exports = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return res.recordNotFound({ message: "User not found" });
    }

    // Delete old OTPs (using consistent capitalization)
    await Otp.deleteMany({ email });

    // Generate new OTP
    const { otpCode, otpExpiry } = generateOtp();
    
    // Create new OTP (using consistent capitalization)
    await Otp.create({
      email,
      otp: otpCode,
      expiresAt: otpExpiry,
    });
    
    // Send OTP email (using user.username instead of undefined username)
    // await sendOtpEmail(email, otpCode, user.username);
    const username = user.username || user.name || 'User';
    
    // Send OTP email with error handling
    try {
      await sendOtpEmail(email, otpCode, username);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Still return success to user but log the email error
      // You might want to handle this differently based on your requirements
      return res.success({ 
        message: "Password reset initiated. If email doesn't arrive, please contact support." 
      });
    }


    return res.success({ message: "OTP sent to your email" });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.internalServerError({
      message: "Forgot password failed",
      data: { errors: error.message },
    });
  }
};