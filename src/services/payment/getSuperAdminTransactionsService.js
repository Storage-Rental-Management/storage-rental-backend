const Payment = require("../../models/payment");
const User = require("../../models/user");
const { ROLES } = require("../../constants/databaseEnums");
const { centsToDollars } = require("../../config/stripe");

module.exports = async (req, res) => {
  try {
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return res.unAuthorized({
        message: "Only super admins can view transactions",
      });
    }

    // Filters
    const {
      user,
      type,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const match = {};
    const andConditions = [];

    // Type filter
    if (type) {
      if (type === "payout" || type === "payment") {
        match.paymentType = type;
      }
    }

    // Status filter
    if (status) {
      match.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    // Build search conditions
    const searchConditions = [];

    // Handle user-specific search or general search
    if (user || search) {
      const searchTerm = user || search;

      // Find users by username or email
      const userQuery = [
        { username: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];

      const users = await User.find({ $or: userQuery }, "_id");
      const userIds = users.map((u) => u._id);

      if (userIds.length > 0) {
        searchConditions.push(
          { payerId: { $in: userIds } },
          { receiverId: { $in: userIds } }
        );
      }
    }

    // Handle general search functionality
    if (search) {
      // Search by transaction ID
      searchConditions.push({
        transactionId: { $regex: search, $options: "i" },
      });

      // Search by amount (convert search to cents for comparison)
      const searchAmount = parseFloat(search);
      if (!isNaN(searchAmount) && searchAmount > 0) {
        const searchAmountInCents = Math.round(searchAmount * 100);
        searchConditions.push(
          { amount: searchAmountInCents },
          { baseAmount: searchAmountInCents },
          { netAmount: searchAmountInCents },
          { commission: searchAmountInCents }
        );
      }

      // Search by payment type
      const searchLower = search.toLowerCase();
      if (searchLower.includes("payment")) {
        searchConditions.push({ paymentType: "payment" });
      }
      if (searchLower.includes("payout")) {
        searchConditions.push({ paymentType: "payout" });
      }

      // Search by status
      const statusOptions = ["pending", "completed", "failed", "cancelled"];
      const matchingStatus = statusOptions.find(
        (s) =>
          s.toLowerCase().includes(searchLower) ||
          searchLower.includes(s.toLowerCase())
      );
      if (matchingStatus) {
        searchConditions.push({ status: matchingStatus });
      }
    }

    // Apply search conditions if any exist
    if (searchConditions.length > 0) {
      andConditions.push({ $or: searchConditions });
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      match.$and = andConditions;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const payments = await Payment.find(match)
      .populate("payerId", "username email")
      .populate("receiverId", "username email")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit));

    // Format for UI
    const formatted = payments.map((payment) => {
      // Determine type
      let typeLabel = payment.paymentType === "payout" ? "Payout" : "Payment";

      // User - prioritize payer, fallback to receiver
      let userObj = payment.payerId || payment.receiverId;
      let userName = userObj?.username || userObj?.email || "-";

      // Commission
      let commissionPercent =
        payment.baseAmount && payment.commission
          ? ((payment.commission / payment.baseAmount) * 100).toFixed(0) + "%"
          : "-";

      // Net received
      let netReceived = payment.netAmount
        ? "$" + centsToDollars(payment.netAmount)
        : "-";

      // Status
      let statusLabel = payment.status
        ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
        : "-";

      // Date
      let date = payment.createdAt
        ? payment.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "-";

      return {
        transactionId: payment.transactionId,
        user: userName,
        amount: "$" + centsToDollars(payment.amount),
        type: typeLabel,
        date,
        commission: commissionPercent,
        netReceived,
        status: statusLabel,
        invoiceLink: payment.invoiceLink,
      };
    });

    // Total count for pagination
    const total = await Payment.countDocuments(match);

    return res.success({
      message: "Superadmin transactions fetched successfully",
      data: formatted,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to fetch transactions",
    });
  }
};
