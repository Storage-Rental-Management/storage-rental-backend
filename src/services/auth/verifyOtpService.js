const User = require("../../models/user");
const Otp = require("../../models/otp");
const { throwError } = require("../../resources/errorHandler");
const { verifyOtpSchema } = require("../../validation/authValidation");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  try {
    const { error, value } = await verifyOtpSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { email, otp } = value;

    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.recordNotFound({ message: "User not found" });
    }

    // Add these checks
    if (user.isVerified) {
      return res.badRequest({ message: "Email already verified." });
    }

    // Check OTP (support STATIC_OTP)
    let otpRecord;
    if (otp === process.env.STATIC_OTP) {
      otpRecord = {
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        _id: null,
      };
    } else {
      otpRecord = await Otp.findOne({
        email,
        otp,
      });
    }
    if (!otpRecord) {
      return res.badRequest({ message: "Invalid OTP" });
    }

    // Check expiry
    if (!otpRecord.expiresAt || new Date() > otpRecord.expiresAt) {
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

    return res.success({
      message: "OTP verified successfully",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          fcm_token: user.fcm_token || "",
          role: user.role,
          authProvider: user.authProvider,
          authProviderId: user.authProviderId,
          isVerified: user.isVerified,
          status: user.status,
          joinedAt: user.joinedAt,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "OTP verification failed",
      data: { errors: error.message },
    });
  }
};
