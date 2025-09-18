const mongoose = require("mongoose");

const documentsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StorageUnit",
    required: true,
  },
  documentType: [{ type: String, required: true }],
  documents: {
    "business-license": [{ type: String }],
    "storage-license": [{ type: String }],
    "id-proof": [{ type: String }],
    "aadhar-card": [{ type: String }],
    "pan-card": [{ type: String }],
    "income-proof": [{ type: String }],
    "reference-letter": [{ type: String }],
    "user-passport": [{ type: String }],
    "driving-license": [{ type: String }],
  },
  status: { type: String, default: "documents-uploaded" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: { type: String },
});

module.exports = mongoose.model("Documents", documentsSchema);
