const StorageProperty = require('../../models/storageProperty');
const { storagePropertySchema } = require('../../validation/storagePropertyValidation');
const { STORAGE_PROPERTY_STATUS } = require('../../constants/databaseEnums');
const { sendPropertyApprovalEmail } = require('../../resources/emailUtils');

module.exports = async (req, res) => {
  try{
    const { error, value } = storagePropertySchema.validate(req.body);
    if (error) return res.validationError({ message: error.details[0].message });

  //   const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const newProperty = new StorageProperty({
      ...value,
      ownerId: req.user.id,
      propertyImage: imagePaths,
      status: STORAGE_PROPERTY_STATUS.DRAFT,
      isApproved: false,
      isActive: true
    });

    const saved = await newProperty.save();

    // Send email to Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      await sendPropertyApprovalEmail(superAdminEmail, {
        companyName: saved.companyName,
        email: saved.email,
        mobileNumber: saved.mobileNumber,
        address: saved.address,
        propertyId: saved._id
      });
    }

    return res.success({ data: saved, message: 'Property created successfully' });
  } catch (error) {
    console.error('Error creating storage property:', error);
    return res.internalServerError({ message: 'Failed to create storage property', data: { errors: error.message } });
  }
};
