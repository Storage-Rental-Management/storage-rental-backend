const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe configuration and utility functions
const stripeConfig = {
  currency: 'usd',
  paymentIntentSettings: {
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    capture_method: 'automatic',
  },
  totalCommissionPercentage: 5,
  stripeFeeStructure: { percentage: 2.9, fixed: 30 },
  platformFeePercentage: 2.1,
};

const dollarsToCents = (dollars) => Math.round(dollars * 100);
const centsToDollars = (cents) => cents / 100;

const calculateFees = (amountCents) => {
  const stripeFee = Math.round((amountCents * stripeConfig.stripeFeeStructure.percentage) / 100) + stripeConfig.stripeFeeStructure.fixed;
  const platformFee = Math.round((amountCents * stripeConfig.platformFeePercentage) / 100);
  const commission = stripeFee + platformFee;
  const netAmount = amountCents - commission;
  return { stripeFee, platformFee, commission, netAmount };
};

// Create payment intent
const createPaymentIntent = async (amountCents, metadata = {}) => {
  try {
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: stripeConfig.currency,
      automatic_payment_methods: stripeConfig.paymentIntentSettings.automatic_payment_methods,
      capture_method: stripeConfig.paymentIntentSettings.capture_method,
      metadata,
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

// Retrieve payment intent
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
};

// Confirm payment intent
const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to confirm payment intent: ${error.message}`);
  }
};

// Capture payment intent
const capturePaymentIntent = async (paymentIntentId, amount = null) => {
  try {
    const captureParams = {};
    if (amount) {
      captureParams.amount = rupeesToPaise(amount);
    }
    
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, captureParams);
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to capture payment intent: ${error.message}`);
  }
};

// Cancel payment intent
const cancelPaymentIntent = async (paymentIntentId, reason = 'requested_by_customer') => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: reason,
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to cancel payment intent: ${error.message}`);
  }
};

// Create refund
const createRefund = async (chargeId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundParams = {
      charge: chargeId,
      reason: reason,
    };
    
    if (amount) {
      refundParams.amount = rupeesToPaise(amount);
    }
    
    const refund = await stripe.refunds.create(refundParams);
    return refund;
  } catch (error) {
    throw new Error(`Failed to create refund: ${error.message}`);
  }
};

// Get payment method details
const getPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    throw new Error(`Failed to retrieve payment method: ${error.message}`);
  }
};

// Create customer
const createCustomer = async (email, name = null, metadata = {}) => {
  try {
    const customerParams = {
      email: email,
      metadata: metadata,
    };
    
    if (name) {
      customerParams.name = name;
    }
    
    const customer = await stripe.customers.create(customerParams);
    return customer;
  } catch (error) {
    throw new Error(`Failed to create customer: ${error.message}`);
  }
};

// Update customer
const updateCustomer = async (customerId, updates) => {
  try {
    const customer = await stripe.customers.update(customerId, updates);
    return customer;
  } catch (error) {
    throw new Error(`Failed to update customer: ${error.message}`);
  }
};

// Create checkout session
const createCheckoutSession = async (params) => {
  try {
    // const stripe = require('stripe')(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: params.payment_method_types || ['card'],
      line_items: params.line_items,
      mode: params.mode || 'payment',
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      customer: params.customer,
      metadata: params.metadata || {},
      currency: params.currency || 'inr',
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      // payment_intent_data: params.payment_intent_data || {},
    });
    return session;
  } catch (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

module.exports = {
  stripe,
  stripeConfig,
  calculateFees,
  dollarsToCents,
  centsToDollars,
  createPaymentIntent,
  createCheckoutSession,
  retrievePaymentIntent,
  confirmPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  createRefund,
  getPaymentMethod,
  createCustomer,
  updateCustomer,
}; 