const Advertisement = require("../../models/advertisement");
const User = require("../../models/user");
const { AD_STATUS } = require("../../constants/databaseEnums");
const { sendAdStatusUpdateEmail } = require("../../resources/emailUtils");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");

const checkAdvertisementExpiry = async () => {
  try {
    const currentDate = new Date();

    // Find all active ads that have expired
    const expiredAds = await Advertisement.find({
      status: AD_STATUS.AD_ACTIVE,
      endDate: { $lt: currentDate },
    }).populate("requesterId", "username email");

    // Process each expired ad
    for (const ad of expiredAds) {
      // Update status to expired
      ad.status = AD_STATUS.AD_EXPIRED;
      await ad.save();

      // Send notification email to requester
      if (ad.requesterId?.email) {
        await sendAdStatusUpdateEmail(ad.requesterId.email, {
          adTitle: ad.adTitle,
          status: "expired",
          expiryDate: ad.endDate.toLocaleString(),
        });
      }

      if (ad.requesterId?._id) {
        await sendNotification({
          recipientId: ad.requesterId._id,
          title: "Advertisement Expired",
          message: `Your advertisement "${ad.adTitle}" has expired. If you’d like to renew or create a new ad, please visit your dashboard. Thank you for advertising with us!`,
          group: "Ad",
          type: NOTIFICATION_TYPE.AD_EXPIRED,
          priority: NOTIFICATION_PRIORITY.MEDIUM,
          metadata: { adId: ad._id, expiryDate: ad.endDate },
          isAction: true,
        });
      }

      console.log(`Processed expired ad: ${ad._id}`);
    }

    return {
      success: true,
      processedCount: expiredAds.length,
    };
  } catch (error) {
    console.error("Advertisement Expiry Check Error:", error);
    throw error;
  }
};

module.exports = checkAdvertisementExpiry;
