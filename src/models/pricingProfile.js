const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');

const pricingProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  yearlyCharge: { type: Number, required: true },
  yearlyDiscount: { type: Number, default: 0 },
  monthlyCharge: { type: Number, required: true },
  monthlyDiscount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

pricingProfileSchema.plugin(excludeDeleted);

module.exports = mongoose.model('PricingProfile', pricingProfileSchema);