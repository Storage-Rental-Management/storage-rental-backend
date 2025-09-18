const Booking = require('../../models/booking');
const User = require('../../models/user');
const { sendNotification } = require('../../resources/notification');
const StorageUnit = require('../../models/storageUnit');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    if (!bookingId) {
      return res.validationError({ message: 'Booking ID is required.' });
    }

    // Update booking status to rejected (add this status to your enums if needed)
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { bookingStatus: 'reservation-rejected' },
      { new: true }
    );
    if (!booking) return res.recordNotFound({ message: 'Booking not found' });

    // Notify the user
    // Fetch user and unit for context-rich message
    const customer = await User.findById(booking.customerId);
    let unitName = '';
    try {
      const unit = await StorageUnit.findById(booking.unitId);
      if (unit && unit.name) unitName = unit.name;
    } catch (e) {}
    const userName = customer?.username || 'User';
    let msg = reason
      ? `Hi ${userName}, your reservation for ${unitName ? ' unit "' + unitName + '"' : ''} was rejected. Reason: ${reason}`
      : `Hi ${userName}, unfortunately your reservation${unitName ? ' for unit "' + unitName + '"' : ''} was rejected after the meeting. Please contact support for more information.`;
    await sendNotification({
      recipientId: booking.customerId,
      title: 'Reservation Rejected',
      message: msg,
      group: 'Booking',
      type: NOTIFICATION_TYPE.RESERVATION_REJECTED,
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: { bookingId: booking._id, unitId: booking.unitId },
      isAction: true
    });

    return res.success({
      data: booking,
      message: 'Reservation rejected and user notified.'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 