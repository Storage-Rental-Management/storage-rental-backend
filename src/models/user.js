const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
      unique: false,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: false,
    },
    authProvider: {
      type: String,
      default: "local",
    },
    authProviderId: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "Active",
    },
    fcm_token: {
      type: String,
      required: false,
    },
    device_id: {
      type: String,
      required: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
      default: "",
    },
    stripeAccountId: { type: String },
    stripeCustomerId: { type: String },
    bankAccountId: { type: String },
    stripeCredentials: {
      type: Object,
      default: {},
    },
    paymentInstructions: {
      type: Object,
      default: {
        cheque: { type: String, default: "" },
        eTransfer: { type: String, default: "" },
        cash: { type: String, default: "" },
      },
    },
    bookedSlots: [
      {
        type: Date,
        default: [],
      },
    ],
    // like / bookmark
    bookmarkedProperties: [
      { type: mongoose.Schema.Types.ObjectId, ref: "StorageProperty" },
    ],
    bookmarkedUnits: [
      { type: mongoose.Schema.Types.ObjectId, ref: "StorageUnit" },
    ],

    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'past_due', 'canceled'],
      default: 'none'
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Subscription' 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
