const mongoose = require("mongoose");
const {
  NOTIFICATION_STATUS,
  NOTIFICATION_PRIORITY,
} = require("../constants/notificationEnums");

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StorageUnit",
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  group: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: NOTIFICATION_STATUS.UNREAD,
  },
  priority: {
    type: String,
    default: NOTIFICATION_PRIORITY.MEDIUM,
  },
  notificationImages: [{ type: String }],
  metadata: {
    type: Object,
    default: {},
  },
  isAction: {
    type: Boolean,
    default: false,
  },
  isActionCompleted: { type: Boolean, default: false },
  actionCompletedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
