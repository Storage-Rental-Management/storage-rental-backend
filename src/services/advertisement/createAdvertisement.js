const Advertisement = require("../../models/advertisement");
const { AD_STATUS } = require("../../constants/databaseEnums");
const { generateCode } = require("../../resources/utils");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");

module.exports = async (req, res) => {
  try {
    const { adTitle, redirectUrl, startDate, endDate, description, status } =
      req.body;

    const requesterId = req.user.id;

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.validationError({
        message: "End date must be after start date",
      });
    }

    // Generate ad code
    const adCode = await generateCode("AD");

    // Map uploaded images to file paths
    const adImages = req.files
      ? req.files.map((file) => `/uploads/advertisements/${file.filename}`)
      : [];

    // map status to AD_STATUS
    const adStatus =
      status === AD_STATUS.AD_DRAFT
        ? AD_STATUS.AD_DRAFT
        : AD_STATUS.AD_UNDER_REVIEW;

    // Create advertisement
    const advertisement = await Advertisement.create({
      adCode,
      requesterId,
      adTitle,
      adImages,
      redirectUrl,
      startDate,
      endDate,
      description,
      status: adStatus,
    });

    await sendNotification({
      recipientId: requesterId,
      title:
        adStatus === AD_STATUS.AD_DRAFT
          ? "Advertisement Saved as Draft"
          : "Advertisement Submitted for Review",
      message:
        adStatus === AD_STATUS.AD_DRAFT
          ? `Your advertisement "${advertisement.adTitle}" is saved as a draft. You can come back anytime to finish and submit it for review!`
          : `Thanks for submitting your advertisement "${advertisement.adTitle}". Our team will review it soon and notify you once it's approved or if we need more info.`,
      group: "Ad",
      type: NOTIFICATION_TYPE.AD_DRAFT,
      priority: NOTIFICATION_PRIORITY.LOW,
      metadata: { adId: advertisement._id },
      isAction: false,
    });

    return res.success({
      message: "Advertisement created successfully",
      data: advertisement,
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
