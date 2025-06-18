const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');

// 4. BOOKING SCHEMA
const bookingSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageUnit', required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageProperty', required: true },
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: false, default: null },
    documentId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Documents', required: false, default: null }],
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    totalAmount: { type: Number, required: false },
    paymentStatus: { type: String, default: 'pending' },
    bookingStatus: { type: String, default : "processing" },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

bookingSchema.plugin(excludeDeleted);

module.exports = mongoose.model('Booking', bookingSchema);
  