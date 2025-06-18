const { StorageUnit } = require('../../models');
const { storageUnitSchema } = require('../../validation/storageUnitValidation');

module.exports = async (req, res) => {
  try {
    const { error, value } = storageUnitSchema.validate(req.body);
    if (error) return res.validationError({ message: error.details[0].message });

    const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const newUnit = new StorageUnit({
      ...value,
      unitImage: imagePaths
    });
    const saved = await newUnit.save();
    return res.success({ data: saved, message: 'Storage unit created successfully' });
  } catch (error) {
    console.error('Error creating storage unit:', error);
    return res.internalServerError({ message: 'Failed to create storage unit', data: { errors: error.message } });
  }
}; 