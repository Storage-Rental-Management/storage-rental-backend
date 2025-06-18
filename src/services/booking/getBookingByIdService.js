const Booking = require('../../models/booking');

module.exports = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.recordNotFound({ message: 'Booking not found' });
    return res.success({ data: booking });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 