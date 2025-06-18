const User = require("../../models/user");
const Otp = require("../../models/otp");
const { throwError } = require("../../resources/errorHandler");
const { verifyOtpSchema } = require("../../validation/authValidation");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  try {
    const { error, value } = await verifyOtpSchema.validate(req.body);
    if (error) {
      throwError(error.details[0].message, 400);
    }
    const { email, otp } = value;

    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.recordNotFound({ message: "User not found" });
    }

    // Add these checks
    if (user.isVerified) throwError("Email already verified");

    // Check OTP (support STATIC_OTP)
    let otpRecord;
    if (otp === process.env.STATIC_OTP) {
      otpRecord = {
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        _id: null,
      };
    } else {
      otpRecord = await Otp.findOne({
        recordId: user._id.toString(),
        otp,
        record: "Admin",
      });
    }
    if (!otpRecord) {
      return res.badRequest({ message: "Invalid OTP" });
    }

    // const otpRecord = await Otp.findOne({ email, otp, expiresAt: { $gt: new Date() } });

    // Check expiry
    if (!otpRecord.otpExpiry || new Date() > otpRecord.otpExpiry) {
      if (otpRecord._id) {
        await Otp.deleteOne({ _id: otpRecord._id });
      }
      return res.badRequest({ message: "OTP has expired" });
    }

    // Update user verification status
    user.isVerified = true;
    await user.save();

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate JWT like login
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role.name,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("Generated JWT Token:", token);

    return res.success({
      message: "OTP verified successfully",
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        isVerified: true,
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "OTP verification failed",
      data: { errors: error.message },
    });
  }
};
