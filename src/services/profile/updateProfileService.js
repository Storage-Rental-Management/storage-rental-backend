// controllers/profile/updateProfile.js
const User = require("../../models/user");
const { updateProfileSchema } = require("../../validation/profileValidation");
const { ROLES, USER_STATUS } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const data = {
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
    };

    if (typeof req.body.isBlocked !== "undefined") {
      if (currentUser.role !== ROLES.SUPER_ADMIN) {
        return res.unAuthorized({
          message: "Only super admin can modify isBlocked flag.",
        });
      }

      const targetUser = await User.findById(id).populate("role");
      if (!targetUser) return res.recordNotFound({ message: "User not found" });

      const targetRoleName = targetUser.role.name || targetUser.role;

      if (![ROLES.USER, ROLES.ADMIN].includes(targetRoleName)) {
        return res.unAuthorized({
          message: "Super admin can only block/unblock user or admin.",
        });
      }

      const isBlocked =
        req.body.isBlocked === "true" || req.body.isBlocked === true;

      data.isBlocked = isBlocked;
      data.status = isBlocked ? USER_STATUS.BLOCKED : USER_STATUS.ACTIVE;
    }

    const { error } = updateProfileSchema.validate(data);
    if (error) {
      return res.badRequest({ message: error.details[0].message });
    }

    const imageUrl = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : undefined;
    if (imageUrl) data.profileImage = imageUrl;

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.recordNotFound({ message: "User not found" });

    return res.success({
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        fcm_token: updatedUser.fcm_token,
        role: updatedUser.role,
        authProvider: updatedUser.authProvider,
        authProviderId: updatedUser.authProviderId,
        isVerified: updatedUser.isVerified,
        status: updatedUser.status,
        joinedAt: updatedUser.joinedAt,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      message: "User profile updated successfully",
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to update user profile",
      data: { errors: error.message },
    });
  }
};
