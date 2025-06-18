const User = require('../../models/user');
const { updateProfileSchema } = require('../../validation/profileValidation');
const { ROLES } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user; 

    // Extract fields from body
    const data = {
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email
    };

    // ✅ Only SUPER_ADMIN can change isBlocked
    if (typeof req.body.isBlocked !== 'undefined') {
      if (currentUser.role !== ROLES.SUPER_ADMIN) {
        return res.unAuthorized({ message: 'Only super admin can modify isBlocked flag.' });
      }

      // Check target user's role
      const targetUser = await User.findById(id).populate('role');
      if (!targetUser) return res.recordNotFound({ message: 'User not found' });

      // If role is stored as ObjectId, populate to get role.name
      const targetRoleName = targetUser.role.name || targetUser.role;

      if (![ROLES.USER, ROLES.ADMIN].includes(targetRoleName)) {
        return res.unAuthorized({ message: 'Super admin can only block/unblock user or admin.' });
      }

      data.isBlocked = req.body.isBlocked;
    }

    // Joi validation
    const { error } = updateProfileSchema.validate(data);
    if (error) {
      return res.badRequest({ message: error.details[0].message });
    }

    // Handle image upload
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    if (imageUrl) data.profileImage = imageUrl;

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.recordNotFound({ message: 'User not found' });

    return res.success({ data: updatedUser, message: 'User profile updated successfully' });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.internalServerError({
      message: 'Failed to update user profile',
      data: { errors: error.message }
    });
  }
};
