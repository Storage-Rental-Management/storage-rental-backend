const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.id)
      .populate('subscriptionId');

    if (!admin.subscriptionId || admin.subscriptionStatus !== 'active') {
      return res.unAuthorized({ 
        message: 'Active subscription required to access this feature' 
      });
    }

    next();
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};