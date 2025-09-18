const Payment = require('../../models/payment');
const { centsToDollars } = require('../../config/stripe');
const { ROLES } = require('../../constants/databaseEnums');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

module.exports = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== ROLES.ADMIN && userRole !== ROLES.SUPER_ADMIN) {
      return res.unAuthorized({ message: 'Only admins and super admins can view payment statistics' });
    }

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (userRole === ROLES.ADMIN) {
      filter.receiverId = new ObjectId(userId);
    }

    /** -------------------- TOTAL TRANSACTIONS -------------------- */
    const transactionFilter = {
      ...filter,
      paymentType: 'payment',
      status: { $in: ['succeeded', 'paid'] }
    };

    const totalTransactions = await Payment.countDocuments(transactionFilter);

    /** -------------------- TOTAL REVENUE -------------------- */
    const revenueAgg = await Payment.aggregate([
      { $match: transactionFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = centsToDollars(revenueAgg[0]?.total || 0);

    /** -------------------- TOTAL WITHDRAWN -------------------- */
    const payoutFilter = {
      ...filter,
      paymentType: 'payout',
      status: 'paid' // only successful payouts
    };

    const withdrawnAgg = await Payment.aggregate([
      { $match: payoutFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalWithdrawn = centsToDollars(withdrawnAgg[0]?.total || 0);

    /** -------------------- AVAILABLE PAYOUT -------------------- */
    let availablePayout = null;

    if (userRole === ROLES.ADMIN) {
      const netRevenueAgg = await Payment.aggregate([
        {
          $match: {
            ...filter,
            paymentType: 'payment',
            status: { $in: ['succeeded', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netAmount' }
          }
        }
      ]);

      const totalNetRevenue = netRevenueAgg[0]?.total || 0;
      const totalWithdrawnCents = withdrawnAgg[0]?.total || 0;
      const availableCents = totalNetRevenue - totalWithdrawnCents;

      availablePayout = {
        amount: centsToDollars(availableCents),
        currency: 'usd'
      };
    }

    /** -------------------- RESPONSE -------------------- */
    const stats = {
      totalTransactions,
      totalRevenue,
      totalWithdrawn,
      ...(availablePayout && { availablePayout })
    };

    return res.success({
      message: 'Payment statistics retrieved successfully',
      data: stats
    });

  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to get payment statistics",
    }); 
  }
};
