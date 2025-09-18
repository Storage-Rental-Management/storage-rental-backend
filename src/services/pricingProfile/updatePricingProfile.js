const PricingProfile = require('../../models/pricingProfile');
const { pricingProfileUpdateSchema } = require('../../validation/pricingProfileValidation');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = pricingProfileUpdateSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    
    const existingProfile = await PricingProfile.findOne({ _id: id, userId: req.user.id });
    if (!existingProfile) {
      return res.recordNotFound({ message: 'Pricing profile not found or unauthorized' });
    }
    
    const updated = await PricingProfile.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { ...value, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.recordNotFound({ message: 'Pricing profile not found' });
    }
    return res.success({ data: updated, message: 'Pricing profile updated successfully' });
    
  } catch (error) {
    return res.internalServerError({ 
      message: 'Failed to update pricing profile', 
      data: { errors: error.message } 
    });
  }
};