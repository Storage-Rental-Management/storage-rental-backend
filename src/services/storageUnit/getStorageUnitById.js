const { StorageUnit } = require('../../models');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await StorageUnit.findById(id);
    if (!unit) return res.recordNotFound({ message: 'Storage unit not found' });
    return res.success({ data: unit });
  } catch (error) {
    return res.internalServerError({ message: 'Failed to fetch storage unit', data: { errors: error.message } });
  }
}; 