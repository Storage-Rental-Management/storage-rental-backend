const User = require("../../models/user");
const Otp = require("../../models/otp");
const bcrypt = require("bcryptjs");
const { resetPasswordSchema } = require("../../validation/authValidation");
const { decrypt } = require("../../utils/encryption");

module.exports = async (req, res) => {
  try {
    const { error, value } = await resetPasswordSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { token, newPassword, confirmPassword } = value;

    if (newPassword !== confirmPassword) {
      return res.badRequest({ message: "Passwords do not match" });
    }
    // Decrypt token
    let data;
    try {
      data = decrypt(token);
    } catch (err) {
      return res.badRequest({ message: "Invalid or tampered token" });
    }

    if (Date.now() > data.exp) {
      return res.badRequest({ message: "Reset link expired" });
    }

    const user = await User.findOne({ _id: data.userId });
    if (!user) {
      return res.recordNotFound({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    user.isVerified = true;
    await user.save();

    return res.success({ message: "Password reset successful" });
  } catch (error) {
    return res.internalServerError({
      message: "Reset password failed",
      data: { errors: error.message },
    });
  }
};
