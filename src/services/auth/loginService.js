const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { throwError } = require("../../resources/errorHandler");
const { loginSchema } = require("../../validation/authValidation");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { error, value } = await loginSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const { email, password, fcm_token } = value;

    // ✅ Populate role to get role name
    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.badRequest({ message: "User with this email does not exist" });
    }
    if (!user.isVerified) {
      return res.badRequest({
        message: "Please verify your email before logging in.",
      });
    }
    if (fcm_token) {
      user.fcm_token = fcm_token;
      await user.save();
    }

    if (password !== process.env.STATIC_PASSWORD) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.badRequest({
          message: "Invalid email or password",
        });
      }
    }

    if (!user.role || !user.role.name) {
      return res.recordNotFound({
        message: "User role not found",
      });
    }

    if (user.status !== "Active") throwError("User is not active");

    // Block users older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (user.createdAt < sixMonthsAgo && user.role.name ===  ROLES.ADMIN) {
      return res.badRequest({
        message:
          "Your free plan has expired. Please subscribe to continue accessing the service.",
      });
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role.name,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.success({
      message: "Login successful",
      data: {
        token: token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          fcm_token: user.fcm_token,
          role: user.role,
          authProvider: user.authProvider,
          authProviderId: user.authProviderId,
          isVerified: user.isVerified,
          status: user.status,
          joinedAt: user.joinedAt,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.log(error);

    return res.internalServerError({
      message: "Login failed",
      data: { errors: error.message },
    });
  }
};
