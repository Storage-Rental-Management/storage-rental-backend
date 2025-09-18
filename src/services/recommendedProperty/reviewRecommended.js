const StorageProperty = require("../../models/storageProperty");
const StorageUnit = require("../../models/storageUnit");
const User = require("../../models/user");
const Notification = require("../../models/notification");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  RECOMMENDED_STATUS,
  ROLES,
  RECOMMENDED_FOR,
} = require("../../constants/databaseEnums");
const RecommendedProperty = require("../../models/recommendedProperty");

module.exports = async (req, res) => {
  try {
    const { recommendedId } = req.params;
    const { notificationId, decision } = req.body;
    const reviewerId = req.user.id;

    // Validate notification
    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({
          message: "This action has already been completed.",
        });
      }
    }

    // Validate decision
    if (
      ![RECOMMENDED_STATUS.APPROVED, RECOMMENDED_STATUS.REJECTED].includes(
        decision
      )
    ) {
      return res.validationError({ message: "Invalid decision" });
    }

    let recommended = await RecommendedProperty.findById(recommendedId);
    if (!recommended)
      return res.recordNotFound({
        message: "Recommendation request not found",
      });

    // Populate property + unit data
    recommended = await RecommendedProperty.findById(recommended._id)
      .populate("propertyId", "companyName")
      .populate("unitId", "name");

    // Role check
    const reviewer = await User.findById(reviewerId).populate("role");
    if (![ROLES.SUPER_ADMIN].includes(reviewer.role.name)) {
      return res.unAuthorized({
        message: "You are not authorized to review recommendations.",
      });
    }

    if (recommended.status !== RECOMMENDED_STATUS.UNDER_REVIEW) {
      return res.validationError({
        message: "Recommendation request is not under review",
      });
    }

    // Update recommendation status
    recommended.status = decision;
    recommended.reviewedBy = reviewerId;
    recommended.reviewedAt = new Date();
    await recommended.save();

    // Update isFeatured flag based on decision
    if (
      recommended.recommendedFor === RECOMMENDED_FOR.PROPERTY &&
      recommended.propertyId
    ) {
      await StorageProperty.findByIdAndUpdate(recommended.propertyId, {
        isFeatured: true,
      });
    } else if (
      recommended.recommendedFor === RECOMMENDED_FOR.UNIT &&
      recommended.unitId
    ) {
      await StorageUnit.findByIdAndUpdate(recommended.unitId, {
        isFeatured: true,
      });
    }
    // Notify requester
    const user = await User.findById(recommended.requesterId);
    if (user?._id) {
      await sendNotification({
        recipientId: user._id,
        title:
          decision === RECOMMENDED_STATUS.APPROVED
            ? "Recommendation Approved!"
            : "Recommendation Rejected",
        message:
          decision === RECOMMENDED_STATUS.APPROVED
            ? `Your recommendation request for ${recommended.recommendedFor} ${
                recommended?.recommendedFor === RECOMMENDED_FOR.PROPERTY
                  ? recommended?.propertyId?.companyName
                  : recommended?.unitId?.name
              } has been approved.`
            : `Your recommendation request for ${recommended.recommendedFor} ${
                recommended?.recommendedFor === RECOMMENDED_FOR.PROPERTY
                  ? recommended?.propertyId?.companyName
                  : recommended?.unitId?.name
              } has been rejected.`,
        group: "Recommendation",
        type: NOTIFICATION_TYPE.RECOMMENDATION_REVIEWED,
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: { recommendedId: recommended._id },
        isAction: false,
      });
    }

    // Mark notification completed
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        isActionCompleted: true,
        actionCompletedAt: new Date(),
      });
    }

    return res.success({
      message: `Recommendation request has been ${decision.toLowerCase()}`,
      data: recommended,
    });
  } catch (error) {
    console.error("Review Recommendation Error:", error);
    return res.internalServerError({ message: error.message });
  }
};
