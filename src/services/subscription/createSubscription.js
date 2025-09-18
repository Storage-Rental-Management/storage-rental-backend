const stripe = require('../../config/stripe').stripe;
const User = require('../../models/user');
const Subscription = require('../../models/subscription');

module.exports = async (req, res) => {
  try {
    const { priceId } = req.body;
    const adminId = req.user.id;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.recordNotFound({ message: 'Admin not found' });
    }

    // Create or get Stripe customer
    let stripeCustomerId = admin.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: admin.email,
        metadata: { adminId: admin.id }
      });
      stripeCustomerId = customer.id;
      admin.stripeCustomerId = stripeCustomerId;
      await admin.save();
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription details
    const newSubscription = await Subscription.create({
      adminId: admin._id,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      planId: priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    admin.subscriptionId = newSubscription._id;
    admin.subscriptionStatus = subscription.status;
    await admin.save();

    return res.success({
      message: 'Subscription created',
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      }
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};