const User = require("../../models/user");
const Role = require("../../models/role");
const bcrypt = require("bcryptjs");
const { generateOtp } = require("../../resources/utils");
const { sendOtpEmail } = require("../../resources/emailUtils");
const { throwError } = require("../../resources/errorHandler");
const { registerSchema } = require("../../validation/authValidation");
const otp = require("../../models/otp");

module.exports = async (req, res) => {
  try {
    const { error, value } = await registerSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const { username, email, phone, password } = value;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.badRequest({ message: "Email already registered" });
    }

    let role;
    if (req.body.role && req.body.role === "Admin") {
      role = await Role.findOne({ name: "Admin" });
    } else {
      role = await Role.findOne({ name: "User" });
    }

    if (!role) {
      return res.internalServerError({ message: "Role configuration error" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
      role: role._id,
      isVerified: false,
    });

    const { otpCode, otpExpiry } = generateOtp();

    await otp.create({
      email,
      otp: otpCode,
      expiresAt: otpExpiry,
    });

    // Send OTP email
    await sendOtpEmail(email, otpCode, username);

    return res.success({
      data: {
        id: user._id,
        email: user.email,
        role: role.name,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    return res.internalServerError({
      message: "Registration failed",
      data: { errors: error.message },
    });
  }
};
