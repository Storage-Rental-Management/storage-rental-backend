const Booking = require("../../models/booking");
const Payment = require("../../models/payment");
const Notification = require("../../models/notification");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ROLES,
} = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    // Only admin or super admin can use this
    if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.unAuthorized({
        message: "Only admin or super admin can send manual reminders.",
      });
    }

    const { unitId } = req.body;
    if (!unitId) {
      return res.badRequest({ message: "unitId is required." });
    }
    // Find the active booking for this unit
    const booking = await Booking.findOne({
      unitId,
      bookingStatus: BOOKING_STATUS.BOOKING_CONFIRMED,
    }).populate("customerId", "unitId");

    if (!booking) {
      return res.recordNotFound({
        message: "No active booking found for this unit.",
      });
    }
    // Check if a payment for the next month has already been made
    const nextMonthStart = new Date(booking.endDate);
    const nextMonthEnd = new Date(nextMonthStart);
    nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);

    const nextPayment = await Payment.findOne({
      bookingId: booking._id,
      status: { $in: [PAYMENT_STATUS.SUCCEEDED, PAYMENT_STATUS.PAID] },
      paymentDate: { $gte: nextMonthStart, $lt: nextMonthEnd },
    });

    if (nextPayment) {
      return res.success({
        message: "User has already paid for the next month.",
      });
    }

    console.log("Deleting notification for:", {
      type: NOTIFICATION_TYPE.PAYMENT_REMINDER,
      group: "Payment",
      unitId: booking.unitId.toString(),
      recipientId: booking.customerId._id.toString()
    });
    
    // Delete previous payment reminder notifications for this unit and user
    const deletedNotifications = await Notification.deleteMany({
      type: NOTIFICATION_TYPE.PAYMENT_REMINDER,
      group: 'Payment',
      'metadata.unitId': booking.unitId.toString(),
      recipientId: booking.customerId._id.toString()
    });
    console.log("deletedNotifications", deletedNotifications);
    // Send notification using sendNotification utility, with action button 'make_payment'
    await sendNotification({
      recipientId: booking.customerId._id,
      title: "Manual Monthly Payment Reminder",
      message: `Your monthly payment for your booking is due. Please make your payment to continue your storage service for next month.`,
      group: "Payment",
      type: NOTIFICATION_TYPE.PAYMENT_REMINDER,
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: {
        bookingId: booking._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        actionButtons: ["pay_now"],
        actionUserId: booking.customerId._id,
        unitId: booking.unitId._id,
        yearlyCharge: booking.unitId?.yearlyCharge,
        yearlyDiscount: booking.unitId?.yearlyCharge,
        monthlyCharge: booking.unitId?.yearlyCharge,
        monthlyDiscount: booking.unitId?.yearlyCharge,
      },
      isAction: true,
      isActionCompleted: false,
    });

    return res.success({
      message: "Manual payment reminder sent successfully.",
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to send manual payment reminder.",
    });
  }
};
