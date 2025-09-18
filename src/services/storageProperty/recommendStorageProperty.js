const StorageProperty = require('../../models/storageProperty');
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await StorageProperty.findById(id);
    if (!property) return res.recordNotFound({ message: 'Property not found' });

    const updated = await StorageProperty.findByIdAndUpdate(
      id,
      { isFeatured: !property.isFeatured },
      { new: true }
    );
    if (!updated) return res.recordNotFound({ message: 'Property not found' });
    res.success({ message: 'Property recommended', data: updated });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};