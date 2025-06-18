const Booking = require('../../models/booking');

module.exports = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!booking) return res.recordNotFound({ message: 'Booking not found' });
    return res.success({ message: 'Booking deleted successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 