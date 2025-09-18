const Booking = require("../../models/booking");
const User = require("../../models/user");
const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const Notification = require("../../models/notification");
const Payment = require("../../models/payment");
const { dollarsToCents } = require("../../config/stripe");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  BOOKING_STATUS,
  STORAGE_UNIT_STATUS,
  BOOKING_ACTIONS
} = require("../../constants/databaseEnums");
const { formatDate, getMonth } = require("../../resources/utils");
const { generateInvoicePDF } = require("../../utils/invoiceGenerator");
module.exports = async (req, res) => {
  try {
    const { bookingId, bookingStatus, notificationId, payment_period, description, paymentMonth } =
      req.body;
    const adminId = req.user.id;

    if (!bookingId || !bookingStatus) {
      return res.validationError({
        message: "Booking ID and action are required.",
      });
    }

    if (
      !Object.values(BOOKING_ACTIONS).includes(bookingStatus)
    ) {
      return res.validationError({
        message: "Invalid action. Must be: notify-payment or booking cancelled",
      });
    }

    if (notificationId && bookingStatus !== "notify-payment") {
      const existingNotification = await Notification.findById(notificationId);
      if (existingNotification?.isActionCompleted) {
        return res.badRequest({
          message: "This action has already been completed.",
        });
      }
    }

    const booking = await Booking.findById(bookingId)
      .populate("unitId")
      .populate("propertyId")
      .populate("customerId");

    if (!booking) {
      return res.recordNotFound({ message: "Booking not found" });
    }

    // if (booking.bookingStatus !== BOOKING_STATUS.DOCUMENTS_APPROVED) {
    //   return res.validationError({
    //     message: "Booking documents must be approved before taking action.",
    //   });
    // }

    const unitName = booking.unitId?.name || "N/A";
    const unitCode = booking.unitId?.unitCode || "N/A";
    const propertyName = booking.propertyId?.companyName || "N/A";
    const customerName = booking.customerId?.username || "N/A";
    const adminName = req.user.username || "Admin";
    const isNewBooking = booking.bookingStatus !== BOOKING_STATUS.BOOKING_CONFIRMED;

    let newStatus;
    let notificationData;

    switch (bookingStatus) {
      case BOOKING_ACTIONS.NOTIFY_PAYMENT:
        newStatus = BOOKING_STATUS.PAYMENT_PENDING;
        notificationData = {
          recipientId: booking.customerId._id,
          title: "Payment Required",
          message: `Hi ${customerName}, your monthly payment for unit "${unitName}" at "${propertyName}" is now due. Please make your payment to continue your storage service.`,
          group: "Booking",
          type: NOTIFICATION_TYPE.PAYMENT_REMINDER,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: {
            bookingId: booking._id,
            unitId: booking.unitId._id,
            yearlyCharge: booking.unitId?.yearlyCharge,
            yearlyDiscount: booking.unitId?.yearlyCharge,
            monthlyCharge: booking.unitId?.yearlyCharge,
            monthlyDiscount: booking.unitId?.yearlyCharge,
          },
          isAction: false,
          isActionCompleted: false,
        };
        break;

      case BOOKING_ACTIONS.BOOKING_CANCELLED:
        newStatus = BOOKING_STATUS.BOOKING_CANCELLED;
        notificationData = {
          recipientId: booking.customerId._id,
          title: "Booking Cancelled",
          message: `Hello ${customerName}, your booking for unit "${unitName}" (${unitCode}) at "${propertyName}" was cancelled by ${adminName} on ${formatDate(
            new Date()
          )}. If you have questions or believe this was a mistake, please contact support.`,
          group: "Booking",
          type: NOTIFICATION_TYPE.RESERVATION_REJECTED,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: { bookingId: booking._id, unitId: booking.unitId._id },
          isAction: false,
          isActionCompleted: false,
        };
        await Booking.findByIdAndUpdate(bookingId, { endDate: new Date(), description: description || `Booking cancelled by admin ${adminName}` });
        await StorageProperty.findByIdAndUpdate(
          booking.propertyId?._id || booking.propertyId,
          { $inc: { activeCount: -1 } },
          { new: true }
        );
        break;

      case BOOKING_ACTIONS.COLLECT_PAYMENT:
        newStatus = BOOKING_STATUS.BOOKING_CONFIRMED;
        notificationData = {
          recipientId: booking.customerId._id,
          title: "Booking Confirmed",
          message: `Great news, ${customerName}! Your booking for unit "${unitName}" at "${propertyName}" has been confirmed on ${formatDate(
            new Date()
          )}.`,
          group: "Booking",
          type: isNewBooking ? NOTIFICATION_TYPE.BOOKING_CONFIRMED : NOTIFICATION_TYPE.PAYMENT_RECEIVED,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: { bookingId: booking._id, unitId: booking.unitId._id },
          isAction: false,
          isActionCompleted: false,
        };
        
        let startDate, endDate;
        if (isNewBooking) {
          startDate = new Date();
          endDate = new Date(startDate);
          endDate.setFullYear(startDate.getFullYear() + 1);
        } else {
          startDate = booking.startDate;
          endDate = booking.endDate;
        }

        const period = payment_period || booking.payment_period || "monthly";
        const totalAmount = period === "yearly"
          ? (booking.unitId?.yearlyCharge || 0)
          : (booking.unitId?.monthlyCharge || 0);

        await Booking.findByIdAndUpdate(bookingId, {
          ...(isNewBooking ? { startDate, endDate } : {}),
          totalAmount,
          ...(payment_period ? { payment_period: period } : {}),
          description: description || booking.description,
          paymentStatus: PAYMENT_STATUS.SUCCEEDED,
        });

        // Create Payment record for manual payment
        const paymentData = {
          transactionId: `MANUAL-${bookingId}-${Date.now()}`,
          bookingId: booking._id,
          payerId: booking.customerId?._id || booking.customerId,
          receiverId: adminId,
          unitId: booking.unitId?._id || booking.unitId,
          propertyId: booking.propertyId?._id || booking.propertyId,
          amount: dollarsToCents(totalAmount),
          currency: "inr",
          paymentMethod: period,
          paymentPeriod: period,
          baseAmount: dollarsToCents(totalAmount),
          platformFee: 0,
          stripeFee: 0,
          netAmount: dollarsToCents(totalAmount),
          commission: 0,
          status: "succeeded",
          paymentType: "payment",
          paymentDate: new Date(new Date().setMonth(getMonth(paymentMonth || formatDate(new Date(), "MMMM")))),
          metadata: {
            unitName: unitName,
            unitCode: unitCode,
            propertyName: propertyName,
            customerName: customerName,
            adminName: adminName,
          },
          description: description || `${isNewBooking ? "Initial payment" : "Recurring payment"} for unit booking`,
        };

        let paymentRecord = await Payment.create(paymentData);

        // Populate before generating invoice
        paymentRecord = await Payment.findById(paymentRecord._id)
          .populate("payerId", "username email phone")
          .populate("unitId", "name unitType monthlyCharge yearlyCharge")
          .populate("propertyId", "companyName address phone")
          .populate("bookingId", "startDate endDate payment_period");

        // Generate invoice for manual payment
        try {
          const invoiceUrl = await generateInvoicePDF(paymentRecord);
          paymentRecord.invoiceLink = invoiceUrl;
          await paymentRecord.save();
        } catch (error) {
          console.error("Failed to generate invoice:", error.message);
        }
        break;
    }

    await Booking.findByIdAndUpdate(bookingId, { bookingStatus: newStatus, description: description || booking.description });

    // 🏠 Update storage unit status based on booking action
    if (booking.unitId) {
      try {
        let unitUpdateData = {};

        if ([BOOKING_STATUS.BOOKING_CONFIRMED, BOOKING_ACTIONS.COLLECT_PAYMENT].includes(bookingStatus)) {
          // When booking is confirmed, mark unit as occupied
          unitUpdateData = {
            status: STORAGE_UNIT_STATUS.OCCUPIED,
            isAvailable: false,
            updatedAt: new Date(),
          };

          await StorageProperty.findByIdAndUpdate(
            booking.propertyId?._id || booking.propertyId,
            { $inc: { activeCount: 1 } },
            { new: true }
          );
        } else if (bookingStatus === BOOKING_STATUS.BOOKING_CANCELLED) {
          if (booking.unitId.status === STORAGE_UNIT_STATUS.OCCUPIED) {
            unitUpdateData = {
              status: STORAGE_UNIT_STATUS.AVAILABLE,
              isAvailable: true,
              updatedAt: new Date(),
            };

            await StorageProperty.findByIdAndUpdate(
              booking.propertyId?._id || booking.propertyId,
              { $inc: { activeCount: -1 } },
              { new: true }
            );
          } else if (booking.unitId.status === STORAGE_UNIT_STATUS.RESERVED) {
            unitUpdateData = {
              status: STORAGE_UNIT_STATUS.AVAILABLE,
              isAvailable: true,
              updatedAt: new Date(),
            };
          }
        }

        if (Object.keys(unitUpdateData).length > 0) {
          await StorageUnit.findByIdAndUpdate(booking.unitId, unitUpdateData);
        }
      } catch (unitUpdateError) {
        console.error(
          "Failed to update storage unit status:",
          unitUpdateError.message
        );
      }
    }

    try {
      await sendNotification(notificationData);
    } catch (notifyError) {
      console.warn(
        `Notification failed for booking ${bookingId}:`,
        notifyError.message
      );
    }

    if (notificationId && bookingStatus !== "notify-payment") {
      try {
        await Notification.findByIdAndUpdate(notificationId, {
          isActionCompleted: true,
          actionCompletedAt: new Date(),
        });
      } catch (updateError) {
        console.error(
          "❌ Failed to mark original notification as completed:",
          updateError.message
        );
      }
    }

    return res.success({
      data: { bookingId, newStatus,description },
      message: `Booking ${bookingStatus} completed successfully.`,
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
