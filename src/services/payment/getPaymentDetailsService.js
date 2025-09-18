const Payment = require("../../models/payment");
const { centsToDollars } = require("../../config/stripe");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find payment with populated data
    const payment = await Payment.findOne({ transactionId: transactionId })
      .populate("bookingId")
      .populate("payerId", "username email phone")
      .populate("receiverId", "username email phone")
      .populate("unitId", "name unitType size")
      .populate("propertyId", "companyName address");

    if (!payment) {
      return res.recordNotFound({ message: "Payment not found" });
    }

    // Check authorization - only customer, property owner, or admin can view
    const isPayer = payment.payerId._id.toString() === userId;
    const isReceiver = payment.receiverId._id.toString() === userId;
    const isAdmin =
      userRole &&
      (userRole.name === ROLES.ADMIN || userRole.name === ROLES.SUPER_ADMIN);

    if (!isPayer && !isReceiver && !isAdmin) {
      return res.unAuthorized({
        message: "You are not authorized to view this payment",
      });
    }

    // Prepare response data
    const response = {
      transactionId: payment.transactionId,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      status: payment.status,
      amount: centsToDollars(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentPeriod: payment.paymentPeriod,
      paymentMethodType: payment.paymentMethodType,
      paymentDate: payment.paymentDate,
      expiresAt: payment.expiresAt,
      description: payment.description,
      invoiceLink: payment.invoiceLink,
      // Fee breakdown
      fees: {
        baseAmount: centsToDollars(payment.baseAmount || 0),
        platformFee: centsToDollars(payment.platformFee || 0),
        stripeFee: centsToDollars(payment.stripeFee || 0),
        netAmount: centsToDollars(payment.netAmount || 0),
        commision: centsToDollars(payment.commission || 0),
      },

      // Booking details
      booking: {
        id: payment.bookingId._id,
        startDate: payment.bookingId.startDate,
        endDate: payment.bookingId.endDate,
        bookingStatus: payment.bookingId.bookingStatus,
        paymentStatus: payment.bookingId.paymentStatus,
      },

      // Storage unit details
      storageUnit: {
        id: payment.unitId._id,
        name: payment.unitId.name,
        unitType: payment.unitId.unitType,
        size: payment.unitId.size,
      },

      // Property details
      property: {
        id: payment.propertyId._id,
        companyName: payment.propertyId.companyName,
        address: payment.propertyId.address,
      },

      // Customer details (only show if viewer is customer or admin)
      customer:
        isPayer || isAdmin
          ? {
              id: payment.payerId._id,
              username: payment.payerId.username,
              email: payment.payerId.email,
              phone: payment.payerId.phone,
            }
          : null,

      // Property owner details (only show if viewer is property owner or admin)
      propertyOwner:
        isReceiver || isAdmin
          ? {
              id: payment.receiverId._id,
              username: payment.receiverId.username,
              email: payment.receiverId.email,
              phone: payment.receiverId.phone,
            }
          : null,

      // Payment method details (masked for security)
      paymentMethodDetails: payment.paymentMethodDetails
        ? {
            type: payment.paymentMethodDetails.type,
            card: payment.paymentMethodDetails.card
              ? {
                  brand: payment.paymentMethodDetails.card.brand,
                  last4: payment.paymentMethodDetails.card.last4,
                  expMonth: payment.paymentMethodDetails.card.expMonth,
                  expYear: payment.paymentMethodDetails.card.expYear,
                }
              : null,
            upi: payment.paymentMethodDetails.upi
              ? {
                  vpa: payment.paymentMethodDetails.upi.vpa,
                }
              : null,
            netbanking: payment.paymentMethodDetails.netbanking
              ? {
                  bank: payment.paymentMethodDetails.netbanking.bank,
                }
              : null,
          }
        : null,

      // Error details (if payment failed)
      error:
        payment.status === "failed"
          ? {
              reason: payment.failureReason,
              code: payment.failureCode,
            }
          : null,

      // Timestamps
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };

    return res.success({
      message: "Payment details retrieved successfully",
      data: response,
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to get payment details",
    });
  }
};
