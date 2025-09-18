const Advertisement = require('../../models/advertisement');
const { AD_STATUS } = require('../../constants/databaseEnums');
const { sendAdStatusUpdateEmail } = require('../../resources/emailUtils');
const User = require('../../models/user');
const Notification = require('../../models/notification');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
  try {
    const adId = req.params.id;
    const { notificationId, decision } = req.body; 
    const reviewerId = req.user.id;

    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({ message: 'This action has already been completed.' });
      }
    }

    if (![AD_STATUS.AD_APPROVED, AD_STATUS.AD_REJECTED].includes(decision)) {
      return res.validationError({ message: 'Invalid decision' });
    }

    const ad = await Advertisement.findById(adId);
    if (!ad) return res.recordNotFound({ message: 'Ad not found' });

    if (![AD_STATUS.AD_UNDER_REVIEW, AD_STATUS.AD_APPROVED].includes(ad.status)) {
      return res.validationError({ message: 'Ad is not under review or approved' });
    }

    ad.status = decision;
    ad.reviewedBy = reviewerId;
    ad.reviewedAt = new Date();
    await ad.save();

    // Fetch requester email
    const user = await User.findById(ad.requesterId);
    if (user?.email) {
      await sendAdStatusUpdateEmail(user.email, {
        adTitle: ad.adTitle,
        status: decision,
        reviewedDate: ad.reviewedAt.toLocaleString()
      });
      await sendNotification({
        recipientId: user._id,
        title: decision === AD_STATUS.AD_APPROVED ? "Ad Approved!" : "Ad Rejected",
        message: decision === AD_STATUS.AD_APPROVED
          ? `Congratulations! Your ad "${ad.adTitle}" has been approved and is ready for the next step. Thank you for advertising with us!`
          : `We’re sorry, but your ad "${ad.adTitle}" was not approved this time. Please review our guidelines and try again, or contact support for help.`,
        group: 'Ad',
        type: NOTIFICATION_TYPE.AD_REVIEWED,
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: { adId: ad._id },
        isAction: false
      });
    }

    const updateStatus = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isActionCompleted: true,
        actionCompletedAt: new Date()
      },
      { new: true } 
    );

    return res.success({
      message: `Ad has been ${decision.toLowerCase()}`,
      data: ad
    });

  } catch (error) {
    console.error('Review Ad Error:', error);
    return res.internalServerError({ message: error.message });
  }
};
