const StorageProperty = require('../../models/storageProperty');
const { storagePropertySchema } = require('../../validation/storagePropertyValidation');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = storagePropertySchema.validate(req.body);
        if (error) return res.validationError({ message: error.details[0].message });

        //   const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
            const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];     

        const updateData = { ...value };
        if (imagePaths) updateData.propertyImage = imagePaths;

        const updated = await StorageProperty.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.notFound({ message: 'Property not found' });
        return res.success({ data: updated, message: 'Property updated' });
    } catch (error) {
        console.error('Error updating storage property:', error);
        return res.internalServerError({ message: 'Failed to update storage property', data: { errors: error.message } });
    }
};