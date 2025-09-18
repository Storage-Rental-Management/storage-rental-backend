const createBookingService = require('../services/booking/createBookingService');
const getBookingByIdService = require('../services/booking/getBookingByIdService');
const updateBookingService = require('../services/booking/updateBookingService');
const deleteBookingService = require('../services/booking/deleteBookingService');
const getUserBookingsService = require('../services/booking/getUserBookingsService');
const updateBookingStatusService = require('../services/booking/updateBookingStatusService');
const getAllBookingsService = require('../services/booking/getAllBookingsService');
const bookingActionService = require('../services/booking/bookingActionService');
const manualUnitAssignment = require('../services/booking/manualUnitAssignmentService');
const getMonthlyPaymentDetailsService = require('../services/booking/getMonthlyPaymentDetailsService');
const sendCashPaymentRequestService = require('../services/booking/sendCashPaymentRequestService');
const actionCashPaymentRequestService = require('../services/booking/actionCashPaymentRequestService');

const createBooking = async (req, res) => {
  try {
    await createBookingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    await getBookingByIdService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    await updateBookingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    await deleteBookingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    await getUserBookingsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    await updateBookingStatusService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
    try {
      await getAllBookingsService(req, res);
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
  };

const bookingAction = async (req, res) => {
  try {
    await bookingActionService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const assignUnitManually = async (req, res) => {
  try {
    await manualUnitAssignment(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getMonthlyPaymentDetails = async (req, res) => {
  try {
    await getMonthlyPaymentDetailsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const sendCashPaymentRequest = async (req, res) => {
  try {
    await sendCashPaymentRequestService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const actionCashPaymentRequest = async (req, res) => {
  try {
    await actionCashPaymentRequestService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
  getUserBookings,
  updateBookingStatus, 
  getAllBookings,
  bookingAction,
  assignUnitManually,
  getMonthlyPaymentDetails,
  sendCashPaymentRequest,
  actionCashPaymentRequest
}; 