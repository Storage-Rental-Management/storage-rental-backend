const Advertisement = require('../../models/advertisement');
const User = require('../../models/user');
const Role = require('../../models/role')
const { AD_STATUS } = require('../../constants/databaseEnums');
const { sendAdReviewRequestEmail } = require('../../resources/emailUtils');
const { sendNotification } = require("../../resources/notification");
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require("../../constants/notificationEnums");

module.exports = async (req, res) => {
  try {
    const adId = req.params.id;
    const requesterId = req.user.id;

    // Fetch ad
    const ad = await Advertisement.findOne({ _id: adId, requesterId }).populate('requesterId', 'username email');

    if (!ad) {
      return res.recordNotFound({ message: 'Advertisement not found' });
    }


    if (ad.status !== AD_STATUS.AD_DRAFT) {
      return res.validationError({ message: 'Only draft ads can be submitted' });
    }

    // Update status
    ad.status = AD_STATUS.AD_UNDER_REVIEW;
    await ad.save();

    // Get Super Admin(s)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

    if (superAdminEmail) {
      await sendAdReviewRequestEmail(superAdminEmail, {
        adTitle: ad.adTitle,
        requesterId,
        submittedDate: new Date().toLocaleString(),
        adId: ad._id.toString()
      });

      const superAdmin = await User.findOne({ email: superAdminEmail });

      // Send notification to super admin
      await sendNotification({
        recipientId: superAdmin._id,
        title: 'Ad Submitted for Review',
        message: `A new ad titled "${ad.adTitle}" has been submitted for your review. Please take a look and let us know your decision!`,
        group: 'Ad',
        type: NOTIFICATION_TYPE.AD_SUBMITTED,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        metadata: {
          adId: ad._id,
          requesterId,
          actionButtons: ['approve', 'reject'],
          actionUserId: superAdmin._id
        },
        isAction: true,
        isActionCompleted: false
      });
    }

    await sendNotification({
      recipientId: requesterId,
      title: 'Ad Submitted!',
      message: `Thank you for submitting your ad "${ad.adTitle}". Our team will review it shortly and keep you updated!`,
      group: 'Ad',
      type: NOTIFICATION_TYPE.AD_SUBMITTED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: { adId: ad._id },
      isAction: false
    });

    return res.success({
      message: 'Ad submitted for review',
      data: ad
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
