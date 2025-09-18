const Payment = require("../../models/payment");
const StorageProperty = require("../../models/storageProperty");
const StorageUnit = require("../../models/storageUnit");
const { centsToDollars } = require("../../config/stripe");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const {
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Build filter
    let filter = {};

    // Admin: get payments related to their properties/units, type 'payment' only
    if (userRole === ROLES.ADMIN) {
      // 1. Get all properties owned by admin
      const properties = await StorageProperty.find(
        { ownerId: currentUserId },
        "_id"
      );
      const propertyIds = properties.map((p) => p._id);

      // 2. Build filter for payments related to these properties
      filter = {
        propertyId: { $in: propertyIds },
        paymentType: "payment",
      };

      // Optional: filter by userId (payer only)
      if (userId) {
        filter.payerId = userId;
      }
    } else {
      // Other users: can only see their own payments, type 'payment'
      filter = {
        type: "payment",
        $or: [{ payerId: currentUserId }, { receiverId: currentUserId }],
      };
    }

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get payments with pagination
    const payments = await Payment.find(filter)
      .populate("bookingId", "startDate endDate bookingStatus")
      .populate("payerId", "username email")
      .populate("receiverId", "username email")
      .populate("unitId", "name unitType size")
      .populate("propertyId", "companyName")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalPayments = await Payment.countDocuments(filter);

    const formattedPayments = payments.map((payment) => ({
      transactionId: payment.transactionId,
      status: payment.status,
      amount: centsToDollars(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentPeriod: payment.paymentPeriod,
      paymentDate: payment.paymentDate,
      fees: {
        baseAmount: centsToDollars(payment.baseAmount),
        platformFee: centsToDollars(payment.platformFee),
        stripeFee: centsToDollars(payment.stripeFee),
        netAmount: centsToDollars(payment.netAmount),
        commision: centsToDollars(payment.commission),
      },
      booking: payment.bookingId
        ? {
            id: payment.bookingId._id,
            startDate: payment.bookingId.startDate,
            endDate: payment.bookingId.endDate,
            bookingStatus: payment.bookingId.bookingStatus,
          }
        : null,
      payer: payment.payerId
        ? {
            id: payment.payerId._id,
            username: payment.payerId.username,
            email: payment.payerId.email,
          }
        : null,
      receiver: payment.receiverId
        ? {
            id: payment.receiverId._id,
            username: payment.receiverId.username,
            email: payment.receiverId.email,
          }
        : null,
      storageUnit: payment.unitId
        ? {
            id: payment.unitId._id,
            name: payment.unitId.name,
            unitType: payment.unitId.unitType,
            size: payment.unitId.size,
          }
        : null,
      property: payment.propertyId
        ? {
            id: payment.propertyId._id,
            companyName: payment.propertyId.companyName,
          }
        : null,
      invoiceLink: payment.invoiceLink,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    return res.success({
      message: "Payments retrieved successfully",
      data: formattedPayments,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalPayments,
        pages: Math.ceil(totalPayments / limit),
      },
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to get payments",
    });
  }
};
