const Booking = require('../../models/booking');

module.exports = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.customerId, isDeleted: { $ne: true } });
    return res.success({ data: bookings });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 