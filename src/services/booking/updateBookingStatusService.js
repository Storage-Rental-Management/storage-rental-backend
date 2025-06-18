const Booking = require('../../models/booking');
const Joi = require('joi');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');
const ActivityLog = require('../../models/activityLog');

const statusSchema = Joi.object({
  bookingStatus: Joi.string().valid(...Object.values(BOOKING_STATUS)).required()
});

module.exports = async (req, res) => {
  try {
    const { error } = statusSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { bookingStatus: req.body.bookingStatus } },
      { new: true }
    );
    if (!booking) return res.recordNotFound({ message: 'Booking not found' });
    booking.bookingStatus = req.body.bookingStatus;
    await booking.save();

    // Log activity
    await ActivityLog.create({
      bookingId: booking._id,
      userId: req.user.id,
      action: req.body.bookingStatus
    });

    return res.success({ data: booking, message: 'Booking status updated successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 