const Notification = require("../../models/notification");

module.exports = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const { notificationId } = req.params;

    // Only allow deletion if the notification was created by this super admin
    const notification = await Notification.findOne({
      _id: notificationId,
      createdBy: superAdminId,
    });
    if (!notification) {
      return res.recordNotFound({ message: "SuperAdmin cannot delete received notifications. Only notifications created by you can be deleted." });
    }

    await Notification.deleteOne({ _id: notificationId });
    return res.success({ message: "Notification deleted successfully." });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 