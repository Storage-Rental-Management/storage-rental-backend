const Notification = require("../models/notification");
const User = require("../models/user");
const {
  notificationValidationSchema,
} = require("../validation/notificationValidation");
const admin = require("../config/fcm"); // FCM admin instance
const { ROLES } = require("../constants/databaseEnums");
const { safeStringify } = require("../resources/utils");

/**
 * Send a notification (DB save + send FCM only to Users)
 * @param {Object} notificationData - Notification details
 * @param {Object} res - Express response object (optional)
 * @returns {Promise<Object>} - Saved notification document or response
 */
async function sendNotification(notificationData, res = null) {
  // Convert recipientId to string if it's an ObjectId
  if (
    notificationData.recipientId &&
    typeof notificationData.recipientId !== "string"
  ) {
    notificationData.recipientId = String(notificationData.recipientId);
  }

  // Convert metadata ObjectId fields to string if necessary
  if (notificationData.metadata) {
    if (
      notificationData.metadata.unitId &&
      typeof notificationData.metadata.unitId !== "string"
    ) {
      notificationData.metadata.unitId = String(
        notificationData.metadata.unitId
      );
    }
    if (
      notificationData.metadata.propertyId &&
      typeof notificationData.metadata.propertyId !== "string"
    ) {
      notificationData.metadata.propertyId = String(
        notificationData.metadata.propertyId
      );
    }
  }

  try {
    // Step 1: Validate data
    const { error, value } =
      notificationValidationSchema.validate(notificationData);
    if (error) {
      const errorMessage = error.details[0].message;
      if (res) return res.validationError({ message: errorMessage });
      return { success: false, message: errorMessage };
    }

    // Step 2: Save notification to DB
    let savedNotification;
    try {
      const notification = new Notification(value);
      savedNotification = await notification.save();
    } catch (saveErr) {
      console.error("❌ Error saving notification:", saveErr);
      if (res)
        return res.internalServerError({
          message: "Failed to save notification",
        });
      return { success: false, message: "Failed to save notification" };
    }

    // Step 3: Fetch user and role
    const user = await User.findById(value.recipientId).populate("role");
    if (user && user.role && typeof user.role.name === "string") {
      const roleName = user.role.name;
      
      if (roleName === ROLES.USER) {
        let deviceToken = user.fcm_token;
        
        if (deviceToken) {
          try {
            const response = await admin.messaging().sendEachForMulticast({
              tokens: Array.isArray(deviceToken) ? deviceToken : [deviceToken],
              notification: {
                title: value.title,
                body: value.message,
              },
              data: {
                type: value.type,
                priority: value.priority,
                group: value.group,
                // ...value.metadata,
                ...(value.metadata && Object.keys(value.metadata).reduce((acc, key) => {
                  acc[key] = safeStringify(value.metadata[key]);
                  return acc;
                }, {}))
              },
            });
            if(response.responses[0].success) {
              console.log(`✅ FCM sent`);
            } else {
              console.error("❌ FCM failed:", response.responses[0].error);
            }
          } catch (fcmError) {
            console.error("❌ FCM error:", fcmError);
          }
        } else {
          console.warn("⚠️ No deviceToken found for user:", value.recipientId);
        }
      } else {
        console.log(`ℹ️ Skipping FCM push: recipient is a ${roleName}`);
      }
    }

    // Step 4: Return result
    if (res) {
      return res.success({
        data: savedNotification,
        message: "Notification sent successfully",
      });
    }

    return savedNotification;
  } catch (error) {
    console.error("❌ Unexpected error in sendNotification:", error);
    if (res) {
      return res.internalServerError({ message: error.message });
    }
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendNotification,
};
