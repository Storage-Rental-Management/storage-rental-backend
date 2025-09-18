const mongoose = require('mongoose');
const excludeDeleted = require('./plugins/excludeDeleted');

const paymentSchema = new mongoose.Schema({
  // Basic Payment Information
  transactionId: { type: String, required: true, unique: true }, // Internal transaction ID (payment or payout)
  stripePaymentIntentId: { type: String, required: false }, // Stripe Payment Intent ID (legacy)
  stripeCheckoutSessionId: { type: String, required: false }, // Stripe Checkout Session ID (new)
  // stripeChargeId: { type: String }, // Stripe Charge ID (after payment is captured)
  
  // Related Entities
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Payer (customer or admin)
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Receiver (admin or superadmin)
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageUnit', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageProperty', required: true },
  
  // Payment Details
  amount: { type: Number, required: true }, // Amount in cents (Stripe standard)
  currency: { type: String, default: 'inr' }, // Currency code
  paymentMethod: { type: String, enum: ['monthly', 'yearly'], required: true },
  paymentPeriod: { type: String, required: true },
  
  // Fee Structure
  baseAmount: { type: Number, required: true }, // Original amount before fees
  platformFee: { type: Number, default: 0 }, // Platform commission
  stripeFee: { type: Number, default: 0 }, // Stripe processing fee
  netAmount: { type: Number, required: true }, // Amount after all fees
  commission: { type: Number, default: 0 }, // Platform commission (for payout logic)

  remainingAmount: { type: Number, default: 0 },
  
  // Payout Tracking
  stripePayoutId: { type: String }, // Stripe payout reference
  stripeTransferId: { type: String }, // Stripe transfer reference
  
  // Payment Status
  status: { 
    type: String,
    default: 'pending'
  },
  paymentType: { 
    type: String, 
  },
  
  // Stripe Specific Fields
  paymentMethodType: { type: String }, // card, upi, netbanking, etc.
  paymentMethodDetails: { type: mongoose.Schema.Types.Mixed }, // Stripe payment method details
  
  // Metadata
  description: { type: String }, // Payment description
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional metadata
  
  // Timestamps
  paymentDate: { type: Date }, // When payment was actually made
  // expiresAt: { type: Date }, // Payment intent expiry
  refundedAt: { type: Date },
  invoiceLink: { type: String },
  // Error Handling
  failureReason: { type: String },
  failureCode: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better query performance
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ payerId: 1 });
paymentSchema.index({ receiverId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ stripeCheckoutSessionId: 1 }); // New index for checkout sessions
// paymentSchema.index({ stripePaymentIntentId: 1 });


module.exports = mongoose.model('Payment', paymentSchema); 