const mongoose = require("mongoose");
const excludeDeleted = require("./plugins/excludeDeleted");

const storagePropertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: false },
  address: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      // index: "2dsphere",
    },
  },
  description: { type: String, required: false },
  propertyImage: [{ type: String }],
  unitCount: { type: Number, default: 0 },
  activeCount: { type: Number, default: 0 },
  status: { type: String, default: "active" },
  isApproved: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

storagePropertySchema.index({ location: "2dsphere" });

storagePropertySchema.plugin(excludeDeleted);

module.exports = mongoose.model("StorageProperty", storagePropertySchema);
