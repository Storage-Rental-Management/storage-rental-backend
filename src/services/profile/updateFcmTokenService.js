// src/services/profile/updateFcmTokenService.js
const User = require('../../models/user');

module.exports = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.validationError({ message: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcm_token: fcmToken });
    
    return res.success({ message: 'FCM token updated successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};