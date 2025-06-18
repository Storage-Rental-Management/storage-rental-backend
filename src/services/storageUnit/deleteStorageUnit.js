// const { StorageUnit } = require('../../models');

// module.exports = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await StorageUnit.findByIdAndDelete(id);
//     if (!deleted) return res.notFound({ message: 'Storage unit not found' });
//     return res.success({ message: 'Storage unit deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting storage unit:', error);
//     return res.internalServerError({ message: 'Failed to delete storage unit', data: { errors: error.message } });
//   }
// }; 

const { StorageUnit } = require('../../models');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await StorageUnit.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updated) return res.notFound({ message: 'Storage unit not found' });

    return res.success({ message: 'Storage unit deleted successfully (soft delete)' });
  } catch (error) {
    console.error('Error soft deleting storage unit:', error);
    return res.internalServerError({
      message: 'Failed to delete storage unit',
      data: { errors: error.message },
    });
  }
};
