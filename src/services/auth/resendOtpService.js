const User = require('../../models/user');
const { resendOtpSchema } = require('../../validation/authValidation');
const { generateOtp } = require('../../resources/utils');
const { sendOtpEmail } = require('../../resources/emailUtils');
const Otp = require('../../models/otp');

module.exports = async (req, res) => {
  try {
    const { error, value } = await resendOtpSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return res.recordNotFound({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.badRequest({ message: "User already verified" });
    }

    // Delete old OTPs for this user
    await Otp.deleteMany({ email });

    // Generate new OTP
    const { otpCode, otpExpiry } = generateOtp();
    
        await Otp.create({
          email,
          otp: otpCode,
          expiresAt: otpExpiry,
        });
    
    // Send OTP email
    await sendOtpEmail(email, otpCode, user.username);

    return res.success({ message: "OTP resent successfully" });
  } catch (error) {
    return res.internalServerError({
      message: "Resend OTP failed",
      data: { errors: error.message },
    });
  }
};