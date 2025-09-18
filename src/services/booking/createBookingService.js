const { BOOKING_STATUS } = require('../../constants/databaseEnums');
const Booking = require('../../models/booking');
const { createBookingSchema } = require('../../validation/bookingValidation');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');


module.exports = async (req, res) => {

  try {
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }
    const customerId = req.user.id
    const booking = new Booking({
      ...req.body,
      customerId,
    });
    await booking.save();

    const bookingData = await Booking.findById(booking._id)
      .populate('unitId')
      .populate('propertyId')
      .populate('customerId');

    const unitName = bookingData.unitId?.name || 'N/A';
    const unitCode = bookingData.unitId?.unitCode || 'N/A';
    const propertyName = bookingData.propertyId?.companyName || 'N/A';
    const customerName = bookingData.customerId?.username || 'N/A';


    await sendNotification({
      recipientId: req.user.id,
      title: 'Booking Created',
      message: `Hi ${customerName}, your booking for unit "${unitName}" (${unitCode}) at "${propertyName}" was created on ${new Date().toLocaleDateString()}.`,
      group: 'Booking',
      type: NOTIFICATION_TYPE.BOOKING_INITIATED,
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: { bookingId: booking._id, unitId: booking.unitId },
      isAction: false
    });

    return res.success({ data: booking, message: 'Booking created successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 