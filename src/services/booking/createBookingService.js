const { BOOKING_STATUS } = require('../../constants/databaseEnums');
const Booking = require('../../models/booking');
const { createBookingSchema } = require('../../validation/bookingValidation');
const ActivityLog = require('../../models/activityLog');

module.exports = async (req, res) => {
  try {
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const booking = new Booking({
      ...req.body,
      user: req.user._id // set user from token
    });
    await booking.save();

    if (booking._id) {
      await ActivityLog.create({
        bookingId: booking._id,
        userId: req.user.id,
        action: BOOKING_STATUS.FREE
      });
    }


    return res.success({ data: booking, message: 'Booking created successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 