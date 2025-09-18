const {
  Payment,
  Booking,
  StorageUnit,
  StorageProperty,
} = require("../../models");
const {
  centsToDollars,
} = require("../../config/stripe");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const { sendNotification } = require("../../resources/notification");
const { STORAGE_UNIT_STATUS } = require("../../constants/databaseEnums");
const { generateInvoicePDF } = require("../../utils/invoiceGenerator");

module.exports = async (req, res) => {
  try {
    const { checkoutSessionId, paymentMethodId } = req.body;
    const customerId = req.user.id;

    // Find payment record
    const payment = await Payment.findOne({
      stripeCheckoutSessionId: checkoutSessionId,
      payerId: customerId,
    })
      .populate("bookingId")
      .populate("unitId")
      .populate("propertyId");

    if (!payment) {
      return res.recordNotFound({ message: "Payment not found" });
    }

    // Check if payment is already processed
    if (payment.status === "succeeded") {
      return res.badRequest({ message: "Payment already completed" });
    }

    if (payment.status === "failed" || payment.status === "cancelled") {
      return res.badRequest({
        message: "Payment cannot be confirmed in current state",
      });
    }

    // (Optional) If you need to confirm payment, use the session ID with Stripe's API
    // For Checkout Sessions, payment confirmation is handled by Stripe automatically
    // You may want to retrieve the session and check its status

    // Update payment record (simulate confirmation for legacy support)
    payment.status = "succeeded";
    payment.paymentDate = new Date();
    payment.paymentMethodType = "card"; // or get from webhook/session if needed
    payment.paymentMethodDetails = {};

    // --- Generate Invoice PDF ---
    const invoiceUrl = await generateInvoicePDF(payment);
    payment.invoiceLink = invoiceUrl;

    await payment.save();

    // If payment succeeded, update booking status
    if (payment.status === "succeeded") {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: "completed",
        bookingStatus: "active",
        totalAmount: centsToDollars(payment.amount),
        payment_period: payment.paymentMethod,
      });

      // Update storage unit status to occupied
      await StorageUnit.findByIdAndUpdate(payment.unitId, {
        status: STORAGE_UNIT_STATUS.OCCUPIED,
      });

      await StorageProperty.findByIdAndUpdate(
        payment.propertyId,
        { $inc: { activeCount: 1 } },
        { new: true }
      );

      // Create success notification for customer
      await sendNotification({
        recipientId: payment.payerId,
        title: "Payment Successful",
        message: `Your payment of ₹${centsToDollars(payment.amount)} for ${
          payment.unitId.name
        } has been processed successfully.`,
        type: NOTIFICATION_TYPE.PAYMENT_COMPLETED,
        group: "Payment",
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: {
          transactionId: payment.transactionId,
          bookingId: payment.bookingId,
          amount: centsToDollars(payment.amount),
          paymentType: payment.paymentType,
          unitId: payment.unitId,
        },
        isAction: false,
        isActionCompleted: false,
      });

      // Create notification for property owner
      await sendNotification({
        recipientId: payment.propertyOwnerId,
        title: "Payment Received",
        message: `Payment of ₹${centsToDollars(
          payment.netAmount
        )} received for ${payment.unitId.name} booking.`,
        type: NOTIFICATION_TYPE.RENTAL_PAYMENT_RECEIVED,
        group: "Payment",
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: {
          transactionId: payment.transactionId,
          bookingId: payment.bookingId,
          netAmount: centsToDollars(payment.netAmount),
          payerId: payment.payerId,
          paymentType: payment.paymentType,
          unitId: payment.unitId,
        },
        isAction: false,
        isActionCompleted: false,
      });
    }

    // Prepare response
    const response = {
      transactionId: payment.transactionId,
      status: payment.status,
      amount: centsToDollars(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethodType,
      paymentDate: payment.paymentDate,
      bookingStatus:
        payment.status === "succeeded"
          ? "active"
          : payment.bookingId.bookingStatus,
      invoiceLink: payment.invoiceLink,

      // No requiresAction/nextAction for Checkout Session
    };

    if (payment.status === "succeeded") {
      response.message = "Payment completed successfully";
    } else if (payment.status === "processing") {
      response.message = "Payment is being processed";
    } else if (payment.status === "failed") {
      response.message = "Payment failed";
      response.failureReason = payment.failureReason;
    }

    return res.success({
      message: response.message || "Payment status updated",
      data: response,
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to confirm payment",
    });
  }
};
