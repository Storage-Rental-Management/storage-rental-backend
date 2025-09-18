const User = require("../../models/user");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate("role");
    if (!user) {
      return res.recordNotFound({ message: "User not found" });
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
      message: "Get user data successfully",
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
      message: "User verification failed",
      data: { errors: error.message },
    });
  }
};
