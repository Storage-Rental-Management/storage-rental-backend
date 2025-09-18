const StorageProperty = require('../../models/storageProperty');
const { storagePropertySchema } = require('../../validation/storagePropertyValidation');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize propertyImage to always be an array 
    let propertyImage = req.body.propertyImage;
    if (propertyImage && !Array.isArray(propertyImage)) {
      propertyImage = [propertyImage];
    }
    req.body.propertyImage = propertyImage || [];

    // Validate the rest of the fields
    const { error, value } = storagePropertySchema.validate(req.body);
    if (error) return res.validationError({ message: error.details[0].message });

    // Get new uploaded image paths
    const imagePaths = req.files?.map(file => `/uploads/storageProperty/${file.filename}`) || [];

    // Merge existing and new images
    const updateData = { ...value };
    updateData.propertyImage = [...(propertyImage || []), ...imagePaths];

    const updated = await StorageProperty.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.recordNotFound({ message: 'Property not found' });

    return res.success({ data: updated, message: 'Property updated' });

  } catch (error) {
    return res.internalServerError({ message: 'Failed to update storage property', data: { errors: error.message } });
  }
};
