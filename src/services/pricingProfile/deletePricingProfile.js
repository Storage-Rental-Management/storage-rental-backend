// const PricingProfile = require('../../models/pricingProfile');

// module.exports = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await PricingProfile.findByIdAndDelete(id);
//     if (!deleted) return res.notFound({ message: 'Pricing profile not found' });
//     return res.success({ message: 'Pricing profile deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting pricing profile:', error);
//     return res.internalServerError({ message: 'Failed to delete pricing profile', data: { errors: error.message } });
//   }
// }; 

const PricingProfile = require('../../models/pricingProfile');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await PricingProfile.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updated) return res.notFound({ message: 'Pricing profile not found' });

    return res.success({ message: 'Pricing profile deleted successfully (soft delete)' });
  } catch (error) {
    console.error('Error soft deleting pricing profile:', error);
    return res.internalServerError({
      message: 'Failed to delete pricing profile',
      data: { errors: error.message },
    });
  }
};
