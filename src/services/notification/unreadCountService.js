const Notification = require('../../models/notification');

module.exports = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ recipientId: userId, status: 'Unread' });
    return res.success({ data: { unreadCount: count }, message: 'Unread notification count fetched successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 