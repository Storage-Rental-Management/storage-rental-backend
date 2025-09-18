const PricingProfile = require('../../models/pricingProfile');
const { pricingProfileSchema } = require('../../validation/pricingProfileValidation');

module.exports = async (req, res) => {
  try {
    const { error, value } = pricingProfileSchema.validate(req.body);
    if (error) return res.validationError({ message: error.details[0].message });
    const newProfile = new PricingProfile({
      ...value,
      userId: req.user.id
    });
    const saved = await newProfile.save();
    return res.success({ data: saved, message: 'Pricing profile created successfully' });
  } catch (error) {
    return res.internalServerError({ message: 'Failed to create pricing profile', data: { errors: error.message } });
  }
}; 