const User = require("../../models/user");
const { sendResetPasswordEmail } = require("../../resources/emailUtils");
const { forgotPasswordSchema } = require("../../validation/authValidation");
const { encrypt } = require("../../utils/encryption");

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

    // Token payload
    const payload = {
      userId: user._id.toString(),
      exp: Date.now() + 1000 * 60 * 10, // 10 min expiry
    };

    // Set isVerified to false when forgot password is initiated
    user.isVerified = false;
    await user.save();

    const token = encodeURIComponent(encrypt(payload));
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // await sendOtpEmail(email, otpCode, user.username);
    const username = user.username || user.name || "User";

    try {
      await sendResetPasswordEmail(user.email, { username, resetLink });
    } catch (emailError) {
      return res.success({
        message:
          "Password reset initiated. If email doesn't arrive, please contact support.",
      });
    }

    return res.success({ message: "Password reset link sent to your email" });
  } catch (error) {
    return res.internalServerError({
      message: "Forgot password failed",
      data: { errors: error.message },
    });
  }
};
