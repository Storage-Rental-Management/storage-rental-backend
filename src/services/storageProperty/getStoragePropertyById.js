const StorageProperty = require('../../models/storageProperty');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await StorageProperty.findById(id);
    if (!property) return res.recordNotFound({ message: 'Property not found' });
    return res.success({ data: property });
    } catch (error) {
    return res.internalServerError({ message: 'Failed to fetch property', data: { errors: error.message } });
    }
};
