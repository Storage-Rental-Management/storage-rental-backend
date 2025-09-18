const RecommendedProperty = require("../../models/recommendedProperty");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  RECOMMENDED_PROPERTY_STATUS,
  RECOMMENDED_STATUS,
  RECOMMENDED_FOR,
  ROLES,
} = require("../../constants/databaseEnums");
const User = require("../../models/user");
const Role = require("../../models/role");
const { generateCode } = require("../../resources/utils");

module.exports = async (req, res) => {
  try {
    const { propertyId, unitId, startDate, endDate, description } = req.body;
    const requesterId = req.user.id;

    // Validation
    if (!propertyId) {
      return res.validationError({ message: "Property is required" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.validationError({
        message: "End date must be after start date",
      });
    }

    // Decide target type
    let recommendedFor = RECOMMENDED_FOR.PROPERTY;
    if (unitId) {
      recommendedFor = RECOMMENDED_FOR.UNIT;
    }

    // Generate ad code
    const recommendedCode = await generateCode("RD");

    // Create Recommended Property Request
    let recommended = await RecommendedProperty.create({
      recommendedCode,
      requesterId,
      propertyId,
      unitId: unitId || null,
      startDate,
      endDate,
      description,
      status: RECOMMENDED_STATUS.UNDER_REVIEW,
      recommendedFor,
    });

    // Populate property + unit data
    recommended = await RecommendedProperty.findById(recommended._id)
      .populate("propertyId", "companyName")
      .populate("unitId", "name");

    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });
    const superAdmin = await User.findOne({ role: superAdminRole._id });

    // Notify SuperAdmin
    await sendNotification({
      recipientId: superAdmin.id,
      title:
        recommendedFor === RECOMMENDED_FOR.PROPERTY
          ? "New Property Recommendation Request"
          : "New Unit Recommendation Request",
      message:
        recommendedFor === RECOMMENDED_FOR.PROPERTY
          ? `A new recommendation request has been submitted for a property ${recommended?.propertyId?.companyName}.`
          : `A new recommendation request has been submitted for a property unit ${recommended?.unitId?.name}.`,
      group: "Recommendation",
      type: NOTIFICATION_TYPE.RECOMMENDATION_REQUEST,
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: { recommendedId: recommended._id },
      isAction: true,
    });

    return res.success({
      message: "Recommendation request submitted successfully",
      data: recommended,
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
