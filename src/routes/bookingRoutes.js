const express = require("express");
const router = express.Router();
const { isAuthenticated, hasRole } = require("../middlewares/auth");
const {
  createBooking,
  getBookingById,
  updateBooking,
  getAllBookings,
  deleteBooking,
  getUserBookings,
  updateBookingStatus,
  bookingAction,
  assignUnitManually,
  getMonthlyPaymentDetails,
  sendCashPaymentRequest,
  actionCashPaymentRequest,
} = require("../controllers/bookingController");
const { ROLES } = require("../constants/databaseEnums");

router.post("/action", isAuthenticated, bookingAction);
router.get("/user", isAuthenticated, getUserBookings);
router.post("/", isAuthenticated, createBooking);
router.get("/", isAuthenticated, getAllBookings);
router.get("/monthly-payments", isAuthenticated, getMonthlyPaymentDetails);
router.get("/:id", isAuthenticated, getBookingById);
router.put("/:id", isAuthenticated, updateBooking);
router.delete("/:id", isAuthenticated, deleteBooking);
router.put("/:id/status", isAuthenticated, updateBookingStatus);
router.post(
  "/manual-assign",
  isAuthenticated,
  hasRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  assignUnitManually
);
router.post("/cash-payment-request", isAuthenticated, sendCashPaymentRequest);
router.post("/cash-payment-request/action", isAuthenticated, actionCashPaymentRequest);

module.exports = router;
