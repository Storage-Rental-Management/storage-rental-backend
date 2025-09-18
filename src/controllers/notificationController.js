const viewNotificationsService = require("../services/notification/viewNotificationsService");
const unreadCountService = require("../services/notification/unreadCountService");
const markAsReadService = require("../services/notification/markAsReadService");
const createNotificationService = require("../services/notification/createNotificationService");
const typeFilterService = require("../services/notification/typeFilterService");
const createNotificationBySuperAdminService = require("../services/notification/createNotificarionBySuperAdminService");
const deleteSuperAdminNotificationService = require("../services/notification/deleteSuperAdminNotificationService");
const createManualPaymentReminderService = require("../services/notification/createManualPaymentReminderService");
const getCreatedByNotificationsService = require("../services/notification/getCreatedByNotificationsService");

const viewNotifications = async (req, res) => {
  try {
    await viewNotificationsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const unreadCount = async (req, res) => {
  try {
    await unreadCountService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await markAsReadService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    await createNotificationService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const typeFilter = async (req, res) => {
  try {
    await typeFilterService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const createNotificationBySuperAdmin = async (req, res) => {
  try {
    await createNotificationBySuperAdminService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const deleteSuperAdminNotification = async (req, res) => {
  try {
    await deleteSuperAdminNotificationService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const sendManualPaymentReminder = async (req, res) => {
  try {
    await createManualPaymentReminderService(req, res);
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to send manual payment reminder.",
    });
  }
};

const getCreatedByNotifications = async (req, res) => {
  try {
    await getCreatedByNotificationsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  viewNotifications,
  unreadCount,
  markAsRead,
  createNotification,
  typeFilter,
  createNotificationBySuperAdmin,
  deleteSuperAdminNotification,
  sendManualPaymentReminder,
  getCreatedByNotifications,
};
