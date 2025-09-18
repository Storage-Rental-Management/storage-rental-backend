const Booking = require("../../models/booking");
const Payment = require("../../models/payment");
const { centsToDollars } = require("../../config/stripe");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.recordNotFound({ message: "Booking not found" });
    }

    if (
      booking.customerId.toString() !== userId &&
      req.user.role !== ROLES.ADMIN &&
      req.user.role !== ROLES.SUPER_ADMIN
    ) {
      return res.unAuthorized({
        message: "You are not authorized to view payments for this booking",
      });
    }

    // Get all payments for the booking
    const payments = await Payment.find({ bookingId: bookingId })
      .populate("unitId", "name unitType size")
      .populate("propertyId", "companyName")
      .sort({ createdAt: -1 });

    const formattedPayments = payments.map((payment) => ({
      transactionId: payment.transactionId,
      status: payment.status,
      amount: centsToDollars(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentPeriod: payment.paymentPeriod,
      paymentDate: payment.paymentDate,
      invoiceLink: payment.invoiceLink,
      fees: {
        baseAmount: centsToDollars(payment.baseAmount),
        platformFee: centsToDollars(payment.platformFee),
        stripeFee: centsToDollars(payment.stripeFee),
        netAmount: centsToDollars(payment.netAmount),
        commision: centsToDollars(payment.commission),
      },
      storageUnit: {
        name: payment.unitId.name,
        unitType: payment.unitId.unitType,
        size: payment.unitId.size,
      },
      property: {
        companyName: payment.propertyId.companyName,
      },
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    return res.success({
      message: "Payments retrieved successfully",
      data: {
        bookingId: bookingId,
        payments: formattedPayments,
        totalPayments: payments.length,
      },
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to get payments",
    });
  }
};
