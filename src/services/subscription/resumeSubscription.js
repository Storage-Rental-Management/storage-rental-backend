const User = require('../../models/user');
const Subscription = require('../../models/subscription');
const stripe = require('../../config/stripe');


exports.resumeSubscription = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id)
      .populate('subscriptionId');

    if (!admin.subscriptionId) {
      return res.badRequest({ message: 'No subscription found' });
    }

    // Remove the cancellation
    const subscription = await stripe.subscriptions.update(
      admin.subscriptionId.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    // Update local subscription
    await Subscription.findByIdAndUpdate(admin.subscriptionId._id, {
      cancelAtPeriodEnd: false,
      canceledAt: null
    });

    return res.success({
      message: 'Subscription resumed successfully',
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};