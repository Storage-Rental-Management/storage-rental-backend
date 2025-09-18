const { ROLES } = require("../../constants/databaseEnums");
const User = require("../../models/user");
const Notification = require("../../models/notification");
const { sendNotification } = require("../../resources/notification");
const {
  broadcastNotificationValidationSchema,
} = require("../../validation/notificationValidation");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");

module.exports = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = broadcastNotificationValidationSchema.validate(
      req.body
    );
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const {
      title,
      message,
      type = NOTIFICATION_TYPE.SUPER_ADMIN_NOTIFICATION,
      priority = NOTIFICATION_PRIORITY.MEDIUM,
      group = "Notification",
      metadata = {},
    } = value;

    // Handle uploaded images
    const notificationImages = req.files
      ? req.files.map((file) => `/uploads/notifications/${file.filename}`)
      : [];

    // Get users
    const allowedRoles = [ROLES.USER, ROLES.ADMIN];

    const users = await User.find({
      isDeleted: false,
    }).populate("role");

    const filteredRecipients = users.filter((user) => {
      const roleName = user.role?.name;
      return roleName && allowedRoles.includes(roleName);
    });

    if (!filteredRecipients.length) {
      return res.recordNotFound({
        message: "No users found with role 'User' or 'Admin'.",
      });
    }

    // SuperAdmin ID from token
    const superAdminId = req.user.id;

    // Loop through each user: Create + Send
    const sendPromises = filteredRecipients.map(async (user) => {
      const notification = await Notification.create({
        recipientId: user._id,
        createdBy: superAdminId,
        title,
        message,
        type,
        priority,
        group,
        metadata,
        notificationImages,
        isAction: false,
      });

      await sendNotification({
        recipientId: user._id,
        title,
        message,
        type: NOTIFICATION_TYPE.SUPER_ADMIN_NOTIFICATION,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        group: "Notification",
        metadata,
        notificationImages,
        isAction: false,
      });

      return notification;
    });

    // Create a notification for SuperAdmin's own sent list
    const superAdminNotification = await Notification.create({
      recipientId: superAdminId,
      createdBy: superAdminId,
      title,
      message,
      type,
      priority,
      group,
      metadata,
      notificationImages,
      isAction: false,
    });

    await Promise.all(sendPromises);

    return res.success({
      message: `✅ Notification created & sent to ${filteredRecipients.length} users (excluding superAdmins).`,
      data: superAdminNotification,
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Broadcast failed.",
    });
  }
};
