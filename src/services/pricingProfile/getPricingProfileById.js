const PricingProfile = require('../../models/pricingProfile');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await PricingProfile.findById(id);
    if (!profile) return res.notFound({ message: 'Pricing profile not found' });
    return res.success({ data: profile });
  } catch (error) {
    return res.internalServerError({ message: 'Failed to fetch pricing profile', data: { errors: error.message } });
  }
}; 