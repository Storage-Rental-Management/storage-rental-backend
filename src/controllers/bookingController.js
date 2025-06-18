const createBookingService = require('../services/booking/createBookingService');
const getBookingByIdService = require('../services/booking/getBookingByIdService');
const updateBookingService = require('../services/booking/updateBookingService');
const deleteBookingService = require('../services/booking/deleteBookingService');
const getUserBookingsService = require('../services/booking/getUserBookingsService');
const updateBookingStatusService = require('../services/booking/updateBookingStatusService');
const getAllBookingsService = require('../services/booking/getAllBookingsService');

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

module.exports = {
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
  getUserBookings,
  updateBookingStatus, 
  getAllBookings
}; 