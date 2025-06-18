const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');
const { DOCUMENT_TYPES } = require('../constants/databaseEnums');

const storageUnitSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageProperty', required: true },
  name: { type: String, required: true },
  unitType: { type: String, required: true }, 
  size: { type: String, required: true },
  pricingProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingProfile', required: true }, 
  yearlyCharge: { type: Number },
  yearlyDiscount: { type: Number, default: 0 },
  monthlyCharge: { type: Number }, 
  monthlyDiscount: { type: Number, default: 0 },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'available' }, 
  isDeleted: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  unitImage: [{ type: String }], 
  description: { type: String },
  requiredDocuments: [{
    type: String,
    enum: Object.values(DOCUMENT_TYPES), 
  }], 
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

storageUnitSchema.plugin(excludeDeleted);

module.exports = mongoose.model('StorageUnit', storageUnitSchema); 