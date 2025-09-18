const { Payment, Booking } = require('../../models');

module.exports = async (req, res) => {
  try {
    const { checkoutSessionId } = req.body;
    const userId = req.user.id;

    // Find payment
    const payment = await Payment.findOne({ 
      stripeCheckoutSessionId: checkoutSessionId,
      payerId: userId 
    });

    if (!payment) {
      return res.recordNotFound({ message: 'Payment not found' });
    }

    if (payment.status === 'succeeded') {
      return res.badRequest({ message: 'Cannot cancel a completed payment' });
    }

    if (payment.status === 'cancelled') {
      return res.badRequest({ message: 'Payment is already cancelled' });
    }

    // For Checkout Sessions, you can't cancel after completion, so just update DB
    payment.status = 'cancelled';
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: 'pending',
      bookingStatus: 'payment-pending'
    });

    return res.success({
      message: 'Payment cancelled successfully',
      data: {
        transactionId: payment.transactionId,
        status: payment.status
      }
    });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to cancel payment",
    });
  }
};
