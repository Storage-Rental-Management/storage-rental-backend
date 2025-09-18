const User = require('../../models/user');
const Subscription = require('../../models/subscription');
const stripe = require('../../config/stripe');

exports.cancelSubscription = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id)
      .populate('subscriptionId');

    if (!admin.subscriptionId) {
      return res.badRequest({ message: 'No active subscription found' });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      admin.subscriptionId.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update local subscription
    await Subscription.findByIdAndUpdate(admin.subscriptionId._id, {
      cancelAtPeriodEnd: true,
      canceledAt: new Date()
    });

    return res.success({
      message: 'Subscription will be canceled at the end of the billing period',
      data: {
        cancelDate: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};