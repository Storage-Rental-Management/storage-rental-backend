const Booking = require('../../models/booking');
const { updateBookingSchema } = require('../../validation/bookingValidation');
const { BOOKING_STATUS } = require('../../constants/databaseEnums')

module.exports = async (req, res) => {
  try {
    const { error } = updateBookingSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!booking) return res.recordNotFound({ message: 'Booking not found' });

    return res.success({ data: booking, message: 'Booking updated successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 