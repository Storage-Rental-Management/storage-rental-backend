const createCheckoutSessionService = require('../services/payment/createCheckoutSessionService');
const confirmPaymentService = require('../services/payment/confirmPaymentService');
const getPaymentDetailsService = require('../services/payment/getPaymentDetailsService');
const webhookService = require('../services/payment/webhookService');
const getPaymentsByBookingService = require('../services/payment/getPaymentsByBookingService');
const getPaymentsByUserService = require('../services/payment/getPaymentsByUserService');
const cancelPaymentService = require('../services/payment/cancelPaymentService')
const getPaymentStatsService = require('../services/payment/getPaymentStatsService');
const onboardAdminService = require('../services/payment/onboardAdminService');
const getAdminStripeDetailsService = require('../services/payment/getAdminStripeDetailsService');
const updateAdminBankAccountService = require('../services/payment/updateAdminBankAccountService');
const getSuperAdminTransactionsService = require('../services/payment/getSuperAdminTransactionsService');
const requestPayoutService = require('../services/payment/requestPayoutService');
const approvePayoutRequestService = require('../services/payment/approvePayoutRequestService');
const getPayoutRequestsService = require('../services/payment/getPayoutRequestsService');

// Create payment intent
const createCheckoutSession = async (req, res) => {
  try {
    await createCheckoutSessionService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Confirm payment (server-side with payment method)
const confirmPayment = async (req, res) => {
  try {
    await confirmPaymentService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get payment details
const getPaymentDetails = async (req, res) => {
  try {
    await getPaymentDetailsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get payments by booking
const getPaymentsByBooking = async (req, res) => {
  try {
    await getPaymentsByBookingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get payments by user (for admin or property owner)
const getPaymentsByUser = async (req, res) => {
  try {
    await getPaymentsByUserService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Cancel payment
const cancelPayment = async (req, res) => {
  try {
    await cancelPaymentService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Handle Stripe webhook
const handleWebhook = async (req, res) => {
  try {
    await webhookService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get payment statistics (for admin)
const getPaymentStats = async (req, res) => {
  try {
    await getPaymentStatsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const onboardAdmin = async (req, res) => {
  try {
    await onboardAdminService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAdminStripeDetails = async (req, res) => {
  try {
    await getAdminStripeDetailsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const updateAdminBankAccount = async (req, res) => {
  try {
    await updateAdminBankAccountService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get superadmin transactions (with filters/search)
const getSuperAdminTransactions = async (req, res) => {
  try {
    await getSuperAdminTransactionsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Request payout (admin)
const requestPayout = async (req, res) => {
  try {
    await requestPayoutService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Approve/reject payout request (super admin)
const approvePayoutRequest = async (req, res) => {
  try {
    await approvePayoutRequestService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get payout requests (super admin)
const getPayoutRequests = async (req, res) => {
  try {
    await getPayoutRequestsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  confirmPayment,
  getPaymentDetails,
  getPaymentsByBooking,
  getPaymentsByUser,
  cancelPayment,
  handleWebhook,
  getPaymentStats,
  onboardAdmin,
  getAdminStripeDetails,
  updateAdminBankAccount,
  getSuperAdminTransactions,
  requestPayout,
  approvePayoutRequest,
  getPayoutRequests
}; 