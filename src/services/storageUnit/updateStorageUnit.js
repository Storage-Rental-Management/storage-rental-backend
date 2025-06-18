const { StorageUnit } = require('../../models');
const { storageUnitUpdateSchema } = require('../../validation/storageUnitValidation');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = storageUnitUpdateSchema.validate(req.body);
    if (error) return res.validationError({ message: error.details[0].message });

    const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : undefined;
    const updateData = { ...value };
    if (imagePaths) updateData.unitImage = imagePaths;

    const updated = await StorageUnit.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.notFound({ message: 'Storage unit not found' });
    return res.success({ data: updated, message: 'Storage unit updated' });
  } catch (error) {
    console.error('Error updating storage unit:', error);
    return res.internalServerError({ message: 'Failed to update storage unit', data: { errors: error.message } });
  }
}; 