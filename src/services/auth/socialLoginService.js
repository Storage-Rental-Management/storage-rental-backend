const Role = require("../../models/role");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const { oAuthLoginSchema } = require("../../validation/authValidation");

module.exports = async (req, res) => {
  try {
    const { error, value } = await oAuthLoginSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const { email, username, authProvider, authProviderId, fcm_token } = value;

    let userRoles = await Role.findOne({name: 'User'});
    let user = await User.findOne({ email }).populate("role");

    if (!user) {
      const userData = await User.create({
        email,
        username: username || "",
        isVerified: true,
        authProvider,
        authProviderId: authProviderId || "",
        fcm_token,
        role: userRoles._id,
      });
      user = await User.findOne({ email: userData.email }).populate("role");
    } else if (user.authProvider === authProvider && !user.authProviderId) {
      user.authProviderId = authProviderId;
      user.isVerified = true;
      user.fcm_token = fcm_token;
      await user.save();
    } else if (user.authProvider === authProvider && user.authProviderId === authProviderId) {
      user.isVerified = true;
      user.fcm_token = fcm_token;
      await user.save();
    } else {
      return res.badRequest({ message: "Email already registered" });
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
          updatedAt: user.updatedAt
        },
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Login failed",
      data: { errors: error.message },
    });
  }
};
