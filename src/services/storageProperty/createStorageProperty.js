const StorageProperty = require("../../models/storageProperty");
const User = require("../../models/user"); 
const { storagePropertySchema } = require("../../validation/storagePropertyValidation");
const { STORAGE_PROPERTY_STATUS } = require("../../constants/databaseEnums");
const { sendPropertyApprovalEmail } = require("../../resources/emailUtils");
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
  try {
    const { error, value } = storagePropertySchema.validate(req.body);
    if (error) return res.validationError({ message: error.details[0].message });

    const imagePaths = req.files?.map(file => `/uploads/storageProperty/${file.filename}`) || [];

    const newProperty = new StorageProperty({
      ...value,
      ownerId: req.user.id,
      propertyImage: imagePaths,
      status: STORAGE_PROPERTY_STATUS.ACTIVE,
      isApproved: false,
      isActive: true,
    });

    const saved = await newProperty.save();

    const currentUser = await User.findById(req.user.id);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      // await sendPropertyApprovalEmail(superAdminEmail, {
      //   companyName: saved.companyName,
      //   email: saved.email,
      //   mobileNumber: saved.mobileNumber,
      //   address: saved.address,
      //   description: saved.description,
      //   propertyId: saved._id,
      // });

      const superAdmin = await User.findOne({ email: superAdminEmail });
      if (superAdmin) {
        await sendNotification({
          recipientId: superAdmin._id,
          title: 'New Property Created',
          message: `A new property named ${saved.companyName} was created by ${currentUser?.username || currentUser?.email || 'Unknown User'} on ${new Date().toLocaleDateString()}. Please review the property details for accuracy.`,
          group: 'Property',
          type: NOTIFICATION_TYPE.PROPERTY_CREATED,
          priority: NOTIFICATION_PRIORITY.MEDIUM,
          metadata: { propertyId: saved._id },
          isAction: false
        });
      } else {
        console.warn("⚠️ Super Admin not found for notification.");
      }
    }

    await sendNotification({
      recipientId: req.user.id,
      title: 'Property Submitted',
      message: `Your property ${saved.companyName} was created on ${new Date().toLocaleDateString()}. You can now manage your property details.`,
      group: 'Property',
      type: NOTIFICATION_TYPE.PROPERTY_CREATED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: { propertyId: saved._id },
      isAction: false
    });

    return res.success({ data: saved, message: 'Property created successfully' });

  } catch (error) {
    return res.internalServerError({
      message: 'Failed to create storage property',
      data: { errors: error.message },
    });
  }
};
