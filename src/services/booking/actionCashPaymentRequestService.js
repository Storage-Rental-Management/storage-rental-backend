const CashPaymentRequest = require('../../models/cashPaymentRequest');
const Booking = require('../../models/booking');
const User = require('../../models/user');
const Payment = require('../../models/payment');
const Notification = require('../../models/notification');
const StorageProperty = require('../../models/storageProperty');
const { sendNotification } = require('../../resources/notification');
const { dollarsToCents } = require('../../config/stripe');
const mongoose = require('mongoose'); 
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');
const { BOOKING_STATUS, STORAGE_UNIT_STATUS, PAYMENT_STATUS } = require('../../constants/databaseEnums');
const { formatDate, getMonth } = require("../../resources/utils");

module.exports = async (req, res) => {
  try {
    const { requestId, action, reason, notificationId } = req.body;
    const adminId = req.user.id;
    if (!requestId || !['approved', 'rejected'].includes(action)) {
      return res.validationError({ message: 'requestId and valid action (approved/rejected) are required.' });
    }
    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({ message: 'This action has already been completed.' });
      }
    }
    const request = await CashPaymentRequest.findById(requestId);
    if (!request) {
      return res.recordNotFound({ message: 'Cash payment request not found.' });
    }
    if (request.status !== 'pending') {
      return res.badRequest({ message: 'This request has already been processed.' });
    }
    request.status = action;
    request.reason = action === 'rejected' ? (reason || null) : null;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();
    // Optionally, update Booking with latest request status
    await Booking.findByIdAndUpdate(request.bookingId, { cashPaymentRequestId: request._id });
    // Send notification to user
    const user = await User.findById(request.userId);
    let title, message, priority, type;
    if (action === 'approved') {

      const isNewBooking = booking.bookingStatus !== BOOKING_STATUS.BOOKING_CONFIRMED;
      // Update booking status and create payment
      const booking = await Booking.findById(request.bookingId).populate('unitId').populate('propertyId').populate('customerId');
      if (!booking) {
        return res.recordNotFound({ message: 'Booking not found.' });
      }
      // Set startDate to now and endDate to 1 year after
      let startDate, endDate;
      if (isNewBooking) {
        startDate = new Date();
        endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + 1);
      } else {
        startDate = booking.startDate;
        endDate = booking.endDate;
      }

      const period = request.payment_period || 'monthly';
      const totalAmount = booking.unitId?.monthlyCharge || 0;
      await Booking.findByIdAndUpdate(booking._id, {
        bookingStatus: BOOKING_STATUS.BOOKING_CONFIRMED,
        paymentStatus: PAYMENT_STATUS.SUCCEEDED,
        ...(isNewBooking ? { startDate, endDate } : {}),
        totalAmount,
        payment_period: period
      });
      // Update storage unit status to occupied
      if (booking.unitId) {
        await booking.unitId.updateOne({
          status: STORAGE_UNIT_STATUS.OCCUPIED,
          isAvailable: false,
          updatedAt: new Date()
        });

        await StorageProperty.findByIdAndUpdate(
          booking.propertyId?._id || booking.propertyId,
          { $inc: { activeCount: 1 } },
          { new: true }
        );
      }
      // Create Payment record for manual payment
      const paymentData = {
        transactionId: `MANUAL-${booking._id}-${Date.now()}`,
        bookingId: booking._id,
        payerId: booking.customerId?._id || booking.customerId,
        receiverId: adminId,
        unitId: booking.unitId?._id || booking.unitId,
        propertyId: booking.propertyId?._id || booking.propertyId,
        amount: dollarsToCents(totalAmount),
        currency: 'inr',
        paymentMethod: period,
        paymentPeriod: period,
        baseAmount: dollarsToCents(totalAmount),
        platformFee: 0,
        stripeFee: 0,
        netAmount: dollarsToCents(totalAmount),
        commission: 0,
        status: 'succeeded',
        paymentType: 'payment',
        paymentDate: new Date(new Date().setMonth(getMonth(request.month || formatDate(new Date(), "MMMM")))),
        description: 'Manual payment on booking confirmation (cash request approved)',
      };
      await Payment.create(paymentData);
      title = 'Cash Payment Approved';
      message = 'Your request to pay by cash has been approved. Please follow the instructions provided by the admin to complete your payment.';
      priority = NOTIFICATION_PRIORITY.HIGH;
      type = NOTIFICATION_TYPE.CASH_PAYMENT_APPROVED;
    } else {
      title = 'Cash Payment Request Rejected';
      message = `Your request to pay by cash has been rejected.${reason ? ' Reason: ' + reason : ''} Please proceed to pay online.`;
      priority = NOTIFICATION_PRIORITY.HIGH;
      type = NOTIFICATION_TYPE.CASH_PAYMENT_REJECTED;
    }
    await sendNotification({
      recipientId: user._id,
      title,
      message,
      group: 'Payment',
      type,
      priority,
      metadata: { bookingId: request.bookingId, unitId: request.unitId, cashPaymentRequestId: request._id },
      isAction: false,
      isActionCompleted: false
    });
    
    // Update related booking action notifications using bookingId instead of unitId
    const deletedNotifications = await Notification.updateMany(
      {
        type: NOTIFICATION_TYPE.BOOKING_ACTION,
        'metadata.bookingId': { $in: [request.bookingId.toString(), request.bookingId] },
        'metadata.userId': { $in: [request.userId.toString(), request.userId] },
        isActionCompleted: false,
      },
      {
        $set: {
          isActionCompleted: true,
          actionCompletedAt: new Date(),
        },
      }
    );
    console.log("deletedNotifications", deletedNotifications);

    if (notificationId) {
      try {
        await Notification.findByIdAndUpdate(notificationId, {
          isActionCompleted: true,
          actionCompletedAt: new Date()
        });
      } catch (updateError) {
        console.error('Failed to mark notification completed:', updateError.message);
      }
    }
    return res.success({ data: request, message: `Cash payment request ${action}.` });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};