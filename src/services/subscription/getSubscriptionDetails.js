const User = require('../../models/user');
const Subscription = require('../../models/subscription');
const stripe = require('../../config/stripe');

/**
 * Get subscription details for the authenticated admin
 */
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id)
      .populate('subscriptionId role');
    
    if (!admin.subscriptionId) {
      return res.success({
        message: 'No active subscription found',
        data: null
      });
    }

    // Get latest subscription data from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      admin.subscriptionId.stripeSubscriptionId,
      {
        expand: ['plan', 'customer']
      }
    );

    return res.success({
      message: 'Subscription details retrieved',
      data: {
        status: subscription.status,
        plan: subscription.plan.nickname,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        price: subscription.plan.amount / 100,
        currency: subscription.plan.currency
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};