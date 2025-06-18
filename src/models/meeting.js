const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');

const meetingSchema = new mongoose.Schema({
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageUnit', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    title: { type: String, required: true },
    description: { type: String },
    scheduledFor: { type: Date, required: true },
    location: { type: String },
    isDeleted: { type: Boolean, default: false },
    meetingStatus: { type: String, default: 'scheduled' },
    createdAt: { type: Date, default: Date.now }
  });

meetingSchema.plugin(excludeDeleted);

  module.exports = mongoose.model('Meeting', meetingSchema);