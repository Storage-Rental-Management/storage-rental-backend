const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');

const storagePropertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  address: { type: String, required: true },
  propertyImage: [{ type: String }],
  status: { type: String, default: 'draft' }, 
  isApproved: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

storagePropertySchema.plugin(excludeDeleted);

module.exports = mongoose.model('StorageProperty', storagePropertySchema);