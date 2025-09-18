const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  stripeCustomerId: { 
    type: String,
    required: true 
  },
  stripeSubscriptionId: { 
    type: String,
    required: true 
  },
  planId: { 
    type: String,
    required: true 
  },
  status: { 
    type: String,
    enum: ['active', 'past_due', 'canceled', 'paused'],
    default: 'active' 
  },
  lastPaymentStatus: {
    type: String,
    enum: ['succeeded', 'failed', 'pending'],
    default: 'pending'
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentFailureDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number
  },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  pausedAt: { type: Date },
  canceledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);