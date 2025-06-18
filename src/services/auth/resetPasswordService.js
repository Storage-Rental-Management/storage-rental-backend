const User = require('../../models/user');
const Otp = require('../../models/otp');
const bcrypt = require('bcryptjs');
const { resetPasswordSchema } = require('../../validation/authValidation');

module.exports = async (req, res) => {
  try {
    const { error, value } = await resetPasswordSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { email, newPassword, confirmPassword } = value;

    if (newPassword !== confirmPassword) {
      return res.badRequest({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.badRequest({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    return res.success({ message: "Password reset successful" });
  } catch (error) {
    return res.internalServerError({
      message: "Reset password failed",
      data: { errors: error.message },
    });
  }
};