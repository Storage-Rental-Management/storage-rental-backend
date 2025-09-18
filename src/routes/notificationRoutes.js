const { Router } = require("express");
const notificationController = require("../controllers/notificationController");
const { isAuthenticated, hasRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/databaseEnums");
const getUploader = require("../middlewares/upload");
const router = Router();

const upload = getUploader("notifications");

// Get paginated notification list
router.get("/", isAuthenticated, notificationController.viewNotifications);

// Get unread notification count
router.get(
  "/unread-count",
  isAuthenticated,
  notificationController.unreadCount
);

// Mark a notification as read
router.put(
  "/mark-as-read/:notificationId",
  isAuthenticated,
  notificationController.markAsRead
);

// Create a new notification
router.post("/", isAuthenticated, notificationController.createNotification);

// Get notifications filtered by type
router.get("/filter/type", isAuthenticated, notificationController.typeFilter);

// Add this route for superAdmin to get notifications they created
router.get(
  "/created-by",
  isAuthenticated,
  notificationController.getCreatedByNotifications
);

// create notification by super admin
router.post(
  "/create-notification",
  isAuthenticated,
  hasRole(ROLES.SUPER_ADMIN),
  upload.array("notificationImages", 5),
  notificationController.createNotificationBySuperAdmin
);

// Delete a notification created by SuperAdmin
router.delete(
  "/delete-notification/:notificationId",
  isAuthenticated,
  hasRole(ROLES.SUPER_ADMIN),
  notificationController.deleteSuperAdminNotification
);

// Admin manually sends a payment reminder for a unit
router.post(
  "/manual-payment-reminder",
  isAuthenticated,
  notificationController.sendManualPaymentReminder
);


module.exports = router;
