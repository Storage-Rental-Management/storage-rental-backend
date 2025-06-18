const User = require('../../models/user');
const { ROLES } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const userToDelete = await User.findById(id);
    if (!userToDelete) return res.recordNotFound({ message: 'User not found' });

    // Only allow self-delete for user/admin
    if (
      (currentUser.role === ROLES.USER || currentUser.role === ROLES.ADMIN) &&
      currentUser.id !== id
    ) {
      return res.unAuthorized({ message: 'You can only delete your own profile.' });
    }

    // Admin cannot be deleted by others
    if (
      userToDelete.role === ROLES.ADMIN &&
      currentUser.id !== id
    ) {
      return res.unAuthorized({ message: 'Admin can only delete their own profile.' });
    }

    // Super admin cannot be deleted by anyone
    if (userToDelete.role === ROLES.SUPER_ADMIN) {
      return res.unAuthorized({ message: 'Super admin cannot be deleted.' });
    }

    userToDelete.isDeleted = true;
    await userToDelete.save();

    return res.success({ message: 'User profile deleted successfully' });

  } catch (error) {
    console.error('Error deleting user profile:', error);
    return res.internalServerError({
      message: 'Failed to delete user profile',
      data: { errors: error.message }
    });
  }
};
