const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const PricingProfile = require("../../models/pricingProfile");
const User = require("../../models/user");
const { generateCode } = require("../../resources/utils");
const { storageUnitSchema } = require("../../validation/storageUnitValidation");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");

module.exports = async (req, res) => {
  try {
    const imagePaths =
      req.files?.map((file) => `/uploads/storageUnit/${file.filename}`) || [];
    req.body.unitImage = imagePaths;

    if (
      req.body.requiredDocuments &&
      !Array.isArray(req.body.requiredDocuments)
    ) {
      req.body.requiredDocuments = [req.body.requiredDocuments];
    }

    const { error, value } = storageUnitSchema.validate(req.body);
    if (error)
      return res.validationError({ message: error.details[0].message });

    // if (value.pricingProfileId && value.customPricingProfileName) {
    //   return res.validationError({ message: 'Only one of pricingProfileId or customPricingProfileName should be provided' });
    // }

    const unitCode = await generateCode("U");

    const newUnit = new StorageUnit({
      ...value,
      unitCode,
    });

    const saved = await newUnit.save();
    await StorageProperty.findByIdAndUpdate(
      saved.propertyId,
      { $inc: { unitCount: 1 } },
      { new: true }
    );

    const currentUser = await User.findById(req.user.id);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      const superAdmin = await User.findOne({ email: superAdminEmail });
      if (superAdmin) {
        await sendNotification({
          recipientId: superAdmin._id,
          title: "New Storage Unit Created",
          message: `A new storage unit ${unitCode} named ${saved.name} was created by ${currentUser?.username || currentUser?.email || 'Unknown User'} on ${new Date().toLocaleDateString()}. Please review the unit details and ensure it meets platform standards.`,
          group: "Storage",
          type: NOTIFICATION_TYPE.UNIT_CREATED,
          priority: NOTIFICATION_PRIORITY.MEDIUM,
          metadata: { unitId: saved._id, propertyId: saved.propertyId },
          isAction: false,
        });
      }

      await sendNotification({
        recipientId: req.user.id,
        title: "Storage Unit Created",
        message: `Your storage unit ${unitCode} named ${currentUser?.username || currentUser?.email || 'Unknown User'} was created on ${new Date().toLocaleDateString()}. You can now manage this unit and add more details if needed.`,
        group: "Storage",
        type: NOTIFICATION_TYPE.UNIT_CREATED,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        metadata: { unitId: saved._id, propertyId: saved.propertyId },
        isAction: false,
      });
    }

    return res.success({
      data: saved,
      message: "Storage unit created successfully",
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to create storage unit",
      data: { errors: error.message },
    });
  }
};
