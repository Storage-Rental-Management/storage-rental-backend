const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isAuthenticated } = require("../middlewares/auth");

// Get payments by AdminUser (with filters and pagination)
router.get("/user", isAuthenticated, paymentController.getPaymentsByUser);

// // Get admin's Stripe account details
// router.get(
//   "/admin-stripe-details",
//   isAuthenticated,
//   paymentController.getAdminStripeDetails
// );

// Get payment statistics (admin only)
router.get(
  "/stats/overview",
  isAuthenticated,
  paymentController.getPaymentStats
);

// Create checkout session
router.post(
  "/create-checkout-session",
  isAuthenticated,
  paymentController.createCheckoutSession
);

// Confirm payment (server-side with payment method)
router.post("/confirm", isAuthenticated, paymentController.confirmPayment);

// Get payment details by Payment Id
router.get("/:paymentId", isAuthenticated, paymentController.getPaymentDetails);

// Get payments by booking
router.get(
  "/booking/:bookingId",
  isAuthenticated,
  paymentController.getPaymentsByBooking
);

// Cancel payment
router.post("/cancel", isAuthenticated, paymentController.cancelPayment);

// Stripe webhook (no auth required, verified by signature)
router.post("/webhook", paymentController.handleWebhook);

// // Onboard admin for Stripe payouts
// router.post("/onboard-admin", isAuthenticated, paymentController.onboardAdmin);

// // Update admin's bank account from Stripe
// router.put(
//   "/update-admin-bank",
//   isAuthenticated,
//   paymentController.updateAdminBankAccount
// );

// // Get superadmin transactions (with filters/search)
// router.get(
//   "/superadmin/transactions",
//   isAuthenticated,
//   paymentController.getSuperAdminTransactions
// );

// // Request payout (admin)
// router.post(
//   "/payout/request",
//   isAuthenticated,
//   paymentController.requestPayout
// );

// // Approve/reject payout request (super admin)
// router.post(
//   "/payout/action",
//   isAuthenticated,
//   paymentController.approvePayoutRequest
// );

// // Get payout requests (super admin)
// router.get(
//   "/payout/requests",
//   isAuthenticated,
//   paymentController.getPayoutRequests
// );

module.exports = router;
