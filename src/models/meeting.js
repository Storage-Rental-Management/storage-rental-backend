const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');
const { MEETING_TYPES } = require('../constants/databaseEnums');

const meetingSchema = new mongoose.Schema({
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageUnit', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    title: { type: String },
    description: { type: String },
    scheduledFor: { type: Date, required: true },
    location: { type: String },
    meetingType: {
      type: String,
      enum: Object.values(MEETING_TYPES),
      required: true
    },
    meetLink: { type: String },
    phone: { type: String },
    isDeleted: { type: Boolean, default: false },
    isReminderSent: { type: Boolean, default: false },
    meetingStatus: { type: String, default: 'meeting-requested' },
    createdAt: { type: Date, default: Date.now }
  });

meetingSchema.plugin(excludeDeleted);

module.exports = mongoose.model('Meeting', meetingSchema);