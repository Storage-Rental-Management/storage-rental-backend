const Booking = require('../../models/booking');
const Payment = require('../../models/payment');
const StorageUnit = require('../../models/storageUnit');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../constants/databaseEnums');

function normalizeDateToMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = async () => {
  try {
    const today = normalizeDateToMidnight(new Date());

    // Get all confirmed monthly bookings that are active
    const bookings = await Booking.find({
      payment_period: 'monthly',
      bookingStatus: BOOKING_STATUS.BOOKING_CONFIRMED
    }).populate('customerId').populate('unitId');

    for (const booking of bookings) {
      const startDate = normalizeDateToMidnight(new Date(booking.startDate));
      const endDate = normalizeDateToMidnight(new Date(booking.endDate));

      // Skip if today is beyond booking's end date
      if (today >= endDate) continue;

      // ✅ Skip if reminder was already sent today
      if (
        booking.lastPaymentReminderSentOn &&
        normalizeDateToMidnight(booking.lastPaymentReminderSentOn).getTime() === today.getTime()
      ) {
        continue;
      }

      // Calculate expected billing date
      let expectedBillingDate = new Date(startDate);
      while (expectedBillingDate < today) {
        expectedBillingDate.setMonth(expectedBillingDate.getMonth() + 1);
      }

      // Send reminder only if today is the expected billing date
      if (expectedBillingDate.getTime() !== today.getTime()) continue;

      const nextBillingStart = new Date(expectedBillingDate);
      const nextBillingEnd = new Date(expectedBillingDate);
      nextBillingEnd.setMonth(nextBillingEnd.getMonth() + 1);

      // Check if payment already exists for this billing window
      const existingPayment = await Payment.findOne({
        bookingId: booking._id,
        status: { $in: [PAYMENT_STATUS.SUCCEEDED, PAYMENT_STATUS.PAID] },
        paymentDate: {
          $gte: nextBillingStart,
          $lt: nextBillingEnd
        }
      });

      let remindersSent = 0;

      if (!nextPayment) {
        const customerName = booking.customerId?.username || 'User';
        const unitName = booking.unitId?.name || 'your storage unit';
        // Send notification to the user using sendNotification utility
        await sendNotification({
          recipientId: booking.customerId._id,
          title: 'Monthly Payment Due',
          message: `Hi ${customerName}, your monthly payment for unit "${unitName}" is due today. Please make your payment to continue your storage service for next month.`,
          group: 'Payment',
          type: NOTIFICATION_TYPE.PAYMENT_REMINDER,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: {
            bookingId: booking._id,
            startDate: booking.startDate,
            endDate: booking.endDate,
            actionButtons: ['pay_now'],
            actionUserId: booking.customerId._id,
            unitId: booking.unitId._id,
            yearlyCharge: booking.unitId?.yearlyCharge,
            yearlyDiscount: booking.unitId?.yearlyCharge,
            monthlyCharge: booking.unitId?.yearlyCharge,
            monthlyDiscount: booking.unitId?.yearlyCharge,
          },
          isAction: true,
          isActionCompleted: false
        });

        // ✅ Update reminder flag
        booking.lastPaymentReminderSentOn = new Date();
        await booking.save();

        remindersSent++;
      }
    }

    console.log(`✅ Monthly payment reminders processed: ${remindersSent} sent of ${bookings.length} bookings.`);

    return {
      message: 'Monthly payment reminders processed successfully',
      data: {
        totalBookings: bookings.length,
        remindersSent
      }
    };
  } catch (err) {
    console.error('❌ Error sending monthly payment reminders:', err);
    return {
      error: true,
      message: err.message || 'Failed to process monthly payment reminders'
    };
  }
};
