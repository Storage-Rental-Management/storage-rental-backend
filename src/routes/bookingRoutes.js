const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
  createBooking,
  getBookingById,
  updateBooking,
  getAllBookings,
  deleteBooking,
  getUserBookings,
  updateBookingStatus
} = require('../controllers/bookingController');

router.post('/', isAuthenticated, createBooking);
router.get('/', isAuthenticated, getAllBookings);
router.get('/:id', isAuthenticated, getBookingById);
router.put('/:id', isAuthenticated, updateBooking);
router.delete('/:id', isAuthenticated, deleteBooking);
router.get('/user/:userId', isAuthenticated, getUserBookings);
router.put('/:id/status', isAuthenticated, updateBookingStatus);

module.exports = router; 