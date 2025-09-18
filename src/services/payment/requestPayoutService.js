const Payment = require('../../models/payment');
const User = require('../../models/user');
const { PAYMENT_STATUS, PAYMENT_TYPE, ROLES } = require('../../constants/databaseEnums');
const { v4: uuidv4 } = require('uuid');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const adminId = req.user.id;

    if (req.user.role !== ROLES.ADMIN) {
      return res.unAuthorized({ message: 'Only admins can request payouts' });
    }

    if (!amount || amount <= 0) {
      return res.badRequest({ message: 'Valid amount is required' });
    }

    const admin = await User.findById(adminId);
    if (!admin || !admin.stripeAccountId || !admin.bankAccountId) {
      return res.validationError({ message: 'Admin must have connected Stripe and bank account' });
    }

    
    
    // const availablePayments = await Payment.find({
    //   receiverId: adminId,
    //   paymentType: PAYMENT_TYPE.PAYMENT,
    //   remainingAmount: { $gt: 0 },
    // }).sort({ createdAt: 1 });

    const availablePayments = await Payment.find({
      paymentType: PAYMENT_TYPE.PAYMENT,
      remainingAmount: { $gt: 0 },
    })
    .populate('propertyId'); // 👈 Needed to access admin info
    
    const adminPayments = availablePayments.filter(payment =>
      payment.propertyId && payment.propertyId.ownerId?.toString() === adminId
    );
    
    let total = 0;
    const selectedPayments = [];

    for (const payment of adminPayments) {
      if (total >= amount * 100) break;
      selectedPayments.push(payment);
      total += payment.remainingAmount;
    }
    
    if (total < amount * 100) {
      return res.badRequest({
        message: `Not enough available balance. Available: $${(total / 100).toFixed(2)}`,
      });
    }

    const transactionId = `PAYOUT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const payoutAmount = amount * 100;

    // Find superadmin by email from env
    const superAdmin = await User.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (!superAdmin) {
      return res.internalServerError({ message: 'Superadmin not found.' });
    }

    const payoutRequest = new Payment({
      transactionId,
      bookingId: selectedPayments[0].bookingId,
      payerId: superAdmin._id,
      receiverId: adminId,
      unitId: selectedPayments[0].unitId,
      propertyId: selectedPayments[0].propertyId,
      amount: payoutAmount,
      currency: 'usd',
      paymentMethod: 'monthly',
      paymentPeriod: 'monthly',
      baseAmount: payoutAmount,
      platformFee: 0,
      stripeFee: 0,
      netAmount: payoutAmount,
      commission: 0,
      status: PAYMENT_STATUS.REQUESTED,
      paymentType: PAYMENT_TYPE.PAYOUT,
      description: description || `Payout request from ${admin.username}`,
      metadata: {
        requestType: 'payout_request',
        pendingPaymentIds: selectedPayments.map(p => p._id),
        totalAvailableAmount: total
      },
      paymentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      remainingAmount: 0
    });

    await payoutRequest.save();

    // Send notification to superadmin
    if (superAdmin) {
      await sendNotification({
        recipientId: superAdmin._id,
        title: 'New Payout Request Submitted',
        message: `${admin.username} has requested a payout of $${amount}. Please review and process the request at your earliest convenience.`,
        type: NOTIFICATION_TYPE.PAYOUT_REQUESTED,
        group: 'Payment',
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: {
          transactionId: payoutRequest.transactionId,
          amount,
          adminId: adminId,
          actionButtons: ['approve_payout', 'reject_payout'],
          payoutRequestId: payoutRequest.transactionId
        },
        isAction: true,
        isActionCompleted: false
      });
    }

    return res.success({
      message: 'Payout request submitted successfully',
      data: {
        transactionId: payoutRequest.transactionId,
        amount,
        status: payoutRequest.status,
        requestDate: payoutRequest.paymentDate,
      }
    });

  } catch (err) {
    return res.internalServerError({
      message: err.message || "Payout request Failed",
    });
  }
};
