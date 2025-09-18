const CashPaymentRequest = require('../../models/cashPaymentRequest');
const Booking = require('../../models/booking');
const User = require('../../models/user');
const StorageProperty = require('../../models/storageProperty');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
  try {
    const { bookingId, payment_period, payment_type, month, instructions } = req.body;
    const userId = req.user.id;
    if (!bookingId || !payment_period || !payment_type) {
      return res.validationError({ message: 'bookingId, payment period and payment type are required.' });
    }
    // Check for existing pending/approved request for this booking
    const existingRequest = await CashPaymentRequest.findOne({ bookingId, status: { $in: ['pending', 'approved'] } });
    if (existingRequest) {
      return res.badRequest({ message: 'A cash payment request already exists for this booking.' });
    }
    // Create new request
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.recordNotFound({ message: 'Booking not found.' });
    }
    const propertyId = booking.propertyId;
    const unitId = booking.unitId;
    const request = await CashPaymentRequest.create({
      bookingId,
      userId,
      unitId,
      payment_period,
      payment_type,
      instructions,
      month
    });
    // Update booking with request ID
    booking.cashPaymentRequestId = request._id;
    await booking.save();

    // Send notifications
    // Get property and admin
    const property = await StorageProperty.findById(propertyId);
    const adminId = property?.ownerId;
    const user = await User.findById(userId);
    // Notify admin (property owner)
    if (adminId) {
      await sendNotification({
        recipientId: adminId,
        title: 'New Cash Payment Request',
        message: `User ${user?.username || 'User'} has requested to pay by cash for booking ID (${bookingId}). Please review and approve or reject the request.`,
        group: 'Payment',
        type: NOTIFICATION_TYPE.CASH_PAYMENT_REQUESTED,
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: { bookingId, userId, unitId, cashPaymentRequestId: request._id, actionButtons: ['approve', 'reject'] },
        isAction: true,
        isActionCompleted: false
      });
    }
    // Notify user
    await sendNotification({
      recipientId: userId,
      title: 'Cash Payment Request Submitted',
      message: `Your request to pay by cash for booking ID (${bookingId}) has been submitted and is pending admin approval.`,
      group: 'Payment',
      type: NOTIFICATION_TYPE.CASH_PAYMENT_REQUESTED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: { bookingId, unitId, cashPaymentRequestId: request._id },
      isAction: false,
      isActionCompleted: false
    });

    return res.success({ data: request, message: 'Cash payment request sent successfully.' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 