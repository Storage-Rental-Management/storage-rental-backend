const { StorageUnit } = require("../../models");

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await StorageUnit.findById(id);
    if (!unit) return res.recordNotFound({ message: 'Property not found' });

    const updated = await StorageUnit.findByIdAndUpdate(
      id,
      { isFeatured: !unit.isFeatured },
      { new: true }
    );
    if (!updated) return res.recordNotFound({ message: 'Unit not found' });
    res.success({ message: 'Unit recommended', data: updated });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};