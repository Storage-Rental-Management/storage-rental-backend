const mongoose = require('mongoose');
const { CASH_PAYMENT_TYPE } = require('../constants/databaseEnums');

const cashPaymentRequestSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageUnit', required: true },
  payment_period: { type: String, default: 'monthly' },
  month: { type: String, default: null },
  payment_type: { type: String,  enum: Object.values(CASH_PAYMENT_TYPE), required: true, default: 'cash' },
  status: {
    type: String,
    default: 'pending'
  },
  instructions: { type: String, default: null },
  reason: { type: String, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

cashPaymentRequestSchema.index({ bookingId: 1, status: 1 });

module.exports = mongoose.model('CashPaymentRequest', cashPaymentRequestSchema); 