const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema({
  adCode: { type: String, unique: true },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  adTitle: { type: String, required: true },
  adImages: [{ type: String }],
  redirectUrl: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  status: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Advertisement", advertisementSchema);
