const { stripe } = require('../../config/stripe');
const Payment = require('../../models/payment');
const User = require('../../models/user');
const Notification = require('../../models/notification');
const { centsToDollars } = require('../../config/stripe');
const { PAYMENT_STATUS, PAYMENT_TYPE, ROLES } = require('../../constants/databaseEnums');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');
const { sendNotification } = require('../../resources/notification');

module.exports = async (req, res) => {
  try {
    const { payoutRequestId, action, rejectionReason, notificationId } = req.body;
    const superAdminId = req.user.id;

    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({ message: 'This action has already been completed.' });
      }
    }

    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return res.unAuthorized({ message: 'Only super admins can approve/reject payout requests' });
    }

    if (!payoutRequestId || !action) {
      return res.badRequest({ message: 'Payout request ID and action are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.validationError({ message: 'Action must be either "approve" or "reject"' });
    }

    if (action === 'reject' && !rejectionReason) {
      return res.validationError({ message: 'Rejection reason is required when rejecting a payout request' });
    }

    const payoutRequest = await Payment.findOne({
      transactionId: payoutRequestId,
      paymentType: PAYMENT_TYPE.PAYOUT,
      status: PAYMENT_STATUS.REQUESTED
    }).populate('receiverId');

    if (!payoutRequest) {
      return res.recordNotFound({ message: 'Payout request not found or already processed' });
    }

    const admin = payoutRequest.receiverId;

    if (action === 'reject') {
      await Payment.findByIdAndUpdate(payoutRequest._id, {
        status: PAYMENT_STATUS.REJECTED,
        failureReason: rejectionReason,
        updatedAt: new Date()
      });

      await sendNotification({
        recipientId: admin._id,
        title: 'Payout Request Rejected',
        message: `Your payout request of $${centsToDollars(payoutRequest.amount)} has been rejected. Reason: ${rejectionReason}`,
        type: NOTIFICATION_TYPE.PAYOUT_REJECTED,
        group: 'Payment',
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: {
          transactionId: payoutRequest.transactionId,
          amount: centsToDollars(payoutRequest.amount),
          rejectionReason,
          rejectedBy: superAdminId,
          rejectedAt: new Date()
        },
        isAction: false,
        isActionCompleted: false
      });

      if (notificationId) {
        try {
          await Notification.findByIdAndUpdate(notificationId, {
            isActionCompleted: true,
            actionCompletedAt: new Date()
          });
        } catch (updateError) {
          console.error('Failed to mark notification completed:', updateError.message);
        }
      }

      return res.success({
        message: 'Payout request rejected successfully',
        data: {
          transactionId: payoutRequest.transactionId,
          status: PAYMENT_STATUS.REJECTED,
          rejectionReason,
          rejectedBy: superAdminId,
          rejectedAt: new Date()
        }
      });
    }

    if (!admin.stripeAccountId || !admin.bankAccountId) {
      return res.badRequest({ error: 'Admin must have connected Stripe and bank account' });
    }

    const pendingPaymentIds = payoutRequest.metadata?.pendingPaymentIds || [];
    const amount = payoutRequest.amount;

    const matchingPayments = await Payment.find({
      _id: { $in: pendingPaymentIds },
      paymentType: PAYMENT_TYPE.PAYMENT
    }).populate('propertyId');
    
    const adminMatchingPayments = matchingPayments.filter(payment =>
      payment.propertyId && (
        payment.propertyId.ownerId?.toString() === admin._id.toString() ||
        payment.propertyId.adminId?.toString() === admin._id.toString()
      )
    );
    
    const totalAvailable = adminMatchingPayments.reduce((sum, p) => sum + p.remainingAmount, 0);
    
    if (totalAvailable < amount) {
      return res.badRequest({
        message: `Insufficient available balance. Requested: $${(amount / 100).toFixed(2)}, Available: $${(totalAvailable / 100).toFixed(2)}`
      });
    }

    const transfer = await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination: admin.stripeAccountId,
      description: `Transfer to admin ${admin.username}`,
      metadata: {
        receiverId: admin._id.toString(),
        payoutRequestId: payoutRequest.transactionId,
      }
    });

    const payout = await stripe.payouts.create(
      {
        amount,
        currency: 'usd',
        description: `Approved payout to admin ${admin.username}`,
        metadata: {
          receiverId: admin._id.toString(),
          sourceTransfer: transfer.id,
          payoutRequestId: payoutRequest.transactionId,
        },
      },
      {
        stripeAccount: admin.stripeAccountId,
      }
    );

    await Payment.findByIdAndUpdate(payoutRequest._id, {
      status: PAYMENT_STATUS.PROCESSING,
      stripePayoutId: payout.id,
      stripeTransferId: transfer.id,
      updatedAt: new Date()
    });

    let remaining = amount;

    for (const payment of matchingPayments) {
      if (remaining <= 0) break;

      const usable = Math.min(payment.remainingAmount, remaining);
      const newRemaining = payment.remainingAmount - usable;

      await Payment.findByIdAndUpdate(payment._id, {
        $set: {
          remainingAmount: newRemaining,
          stripePayoutId: payout.id,
          stripeTransferId: transfer.id,
          paymentDate: new Date(),
          updatedAt: new Date()
        },
        ...(newRemaining === 0 && { status: PAYMENT_STATUS.PAID })
      });

      remaining -= usable;
    }

    if (notificationId) {
      try {
        await Notification.findByIdAndUpdate(notificationId, {
          isActionCompleted: true,
          actionCompletedAt: new Date()
        });
      } catch (updateError) {
        console.error('Failed to mark notification completed:', updateError.message);
      }
    }

    return res.success({
      message: 'Payout request approved and processed successfully',
      data: {
        transactionId: payoutRequest.transactionId,
        amount: centsToDollars(amount),
        status: PAYMENT_STATUS.PROCESSING,
        stripePayoutId: payout.id,
        stripeTransferId: transfer.id,
        approvedBy: superAdminId,
        approvedAt: new Date()
      }
    });

  } catch (err) {
    return res.internalServerError({
      message: err.message || "Payout approval failed.",
    });
  }
};
