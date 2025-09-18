const Payment = require('../../models/payment');
const User = require('../../models/user');
const { PAYMENT_STATUS, PAYMENT_TYPE, ROLES } = require('../../constants/databaseEnums');
const { centsToDollars } = require('../../config/stripe');

module.exports = async (req, res) => {
  try {
    // Validate user is Super Admin
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return res.unAuthorized({ message: 'Only super admins can view payout requests' });
    }

    const {
      status = 'requested', // Default to show only requested payouts
      adminId,
      page = 1,
      limit = 10
    } = req.query;

    const match = {
      paymentType: PAYMENT_TYPE.PAYOUT
    };

    // Status filter
    if (status === 'all') {
      match.status = { $in: [PAYMENT_STATUS.REQUESTED, PAYMENT_STATUS.APPROVED, PAYMENT_STATUS.REJECTED] };
    } else if (status === 'pending') {
      match.status = { $in: [PAYMENT_STATUS.REQUESTED] };
    } else {
      match.status = status;
    }

    // Admin filter
    if (adminId) {
      match.receiverId = adminId;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch payout requests
    const payoutRequests = await Payment.find(match)
      .populate('receiverId', 'username email companyName')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    // Format for UI
    const formatted = payoutRequests.map(request => {
      const admin = request.receiverId;
      
      return {
        payoutRequestId: request.transactionId,
        adminId: admin._id,
        adminName: admin.username || admin.companyName || 'Unknown',
        adminEmail: admin.email,
        amount: '$' + centsToDollars(request.amount),
        amountInCents: request.amount,
        status: request.status,
        description: request.description,
        requestDate: request.paymentDate,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        failureReason: request.failureReason,
        metadata: request.metadata
      };
    });

    // Total count for pagination
    const total = await Payment.countDocuments(match);

    // Get summary stats
    const stats = {
      total: await Payment.countDocuments({ paymentType: PAYMENT_TYPE.PAYOUT }),
      requested: await Payment.countDocuments({ 
        paymentType: PAYMENT_TYPE.PAYOUT, 
        status: PAYMENT_STATUS.REQUESTED 
      }),
      approved: await Payment.countDocuments({ 
        paymentType: PAYMENT_TYPE.PAYOUT, 
        status: PAYMENT_STATUS.SUCCEEDED 
      }),
      rejected: await Payment.countDocuments({ 
        paymentType: PAYMENT_TYPE.PAYOUT, 
        status: PAYMENT_STATUS.REJECTED 
      })
    };

    return res.success({
      message: 'Payout requests fetched successfully',
      data: formatted,
      stats,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to fetch payout requests",
    }); 
  }
}; 