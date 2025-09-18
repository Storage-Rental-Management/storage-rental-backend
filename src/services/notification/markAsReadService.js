const Notification = require('../../models/notification');

module.exports = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.notificationId; 
    if (!notificationId) {
      return res.validationError({ message: 'Notification ID is required' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { status: 'Read', readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.recordnotFound({ message: 'Notification not found' });
    }
    return res.success({ data: notification, message: 'Notification marked as read' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 