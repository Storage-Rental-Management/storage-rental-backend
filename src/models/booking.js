const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');

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
    payment_period: { type: String, required: false }, 
    bookingStatus: { type: String, default : "processing" }, 
    isManualAssign: { type: Boolean, default: false},
    isDeleted: { type: Boolean, default: false },
    description: { type: String, default: '' },
    lastPaymentReminderSentOn: { type: Date, default: null },
    cashPaymentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashPaymentRequest', required: false, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

bookingSchema.plugin(excludeDeleted);

module.exports = mongoose.model('Booking', bookingSchema);
  