const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { throwError } = require('../../resources/errorHandler');
const { loginSchema } = require('../../validation/authValidation');

module.exports = async (req, res) => {
  try {
    const { error, value } = await loginSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { email, password } = value;

    // ✅ Populate role to get role name
    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.badRequest({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res.badRequest({
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throwError('Invalid email or password');

    if (user.status !== 'Active') throwError('User is not active');

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role.name,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.success({
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        status: user.status,
        isVerified: user.isVerified
      },
    });
  } catch (error) {
    throwError(error.details?.[0]?.message || error.message, 400);
  }
};