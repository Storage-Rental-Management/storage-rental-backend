const Payment = require("../../models/payment");
const Booking = require("../../models/booking");
const Notification = require("../../models/notification");
const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");

const Subscription = require('../../models/subscriptions');
const User = require("../../models/user");
const { stripe, centsToDollars } = require("../../config/stripe");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  PAYMENT_STATUS,
  STORAGE_UNIT_STATUS,
  BOOKING_STATUS,
} = require("../../constants/databaseEnums");
const { sendNotification } = require("../../resources/notification");
const user = require("../../models/user");
const { generateInvoicePDF } = require("../../utils/invoiceGenerator");

module.exports = async (req, res) => {
  // Determine which endpoint is being called and use the correct secret
  let endpointSecret;
  if (req.originalUrl.endsWith("/webhook/connect")) {
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_CONNECT;
  } else {
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_PLATFORM;
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
  
    // Platform account event (existing logic)
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          await handleSubscriptionUpdate(subscription);
          break;
        }
      case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          await handleSuccessfulPayment(invoice);
          break;
        }
      case 'invoice.payment_failed': {
          const invoice = event.data.object;
          await handleFailedPayment(invoice);
          break;
        }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    console.log("✅ Webhook processed successfully");
    return res.json({ received: true });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Webhook Processing Failed",
    });
  }
};


const handleSubscriptionUpdate = async (subscription) => {
  try {
    const user = await User.findOne({ 
      'stripeCustomerId': subscription.customer 
    });
    
    if (!user) {
      console.error('No user found for customer:', subscription.customer);
      return;
    }

    const subscriptionData = {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };

    // Update subscription in database
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      subscriptionData,
      { new: true }
    );

    // Update user's subscription status
    user.subscriptionStatus = subscription.status;
    await user.save();

    // Send notification to admin
    await sendNotification({
      recipientId: user._id,
      title: 'Subscription Updated',
      message: `Your subscription has been ${subscription.status}`,
      type: NOTIFICATION_TYPE.SUBSCRIPTION_UPDATED,
      group: 'Subscription',
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      },
      isAction: false,
      isActionCompleted: false
    });

  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
};

const handleSuccessfulPayment = async (invoice) => {
  try {
    const user = await User.findOne({ 
      'stripeCustomerId': invoice.customer 
    });
    
    if (!user) {
      console.error('No user found for customer:', invoice.customer);
      return;
    }

    // Update subscription payment status
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: invoice.subscription },
      { 
        status: 'active',
        lastPaymentStatus: 'succeeded',
        lastPaymentDate: new Date()
      }
    );

    // Send success notification
    await sendNotification({
      recipientId: user._id,
      title: 'Payment Successful',
      message: `Your subscription payment of ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()} was successful`,
      type: NOTIFICATION_TYPE.PAYMENT_COMPLETED,
      group: 'Subscription',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        actionButtons: ['view_receipt'],
        receiptUrl: invoice.hosted_invoice_url
      },
      isAction: true,
      isActionCompleted: false
    });

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

const handleFailedPayment = async (invoice) => {
  try {
    const user = await User.findOne({ 
      'stripeCustomerId': invoice.customer 
    });
    
    if (!user) {
      console.error('No user found for customer:', invoice.customer);
      return;
    }

    // Update subscription payment status
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: invoice.subscription },
      { 
        status: 'past_due',
        lastPaymentStatus: 'failed',
        lastPaymentFailureDate: new Date()
      }
    );

    // Send failure notification
    await sendNotification({
      recipientId: user._id,
      title: 'Payment Failed',
      message: `Your subscription payment of ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()} has failed. Please update your payment method.`,
      type: NOTIFICATION_TYPE.PAYMENT_FAILED,
      group: 'Subscription',
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        actionButtons: ['update_payment_method', 'contact_support']
      },
      isAction: true,
      isActionCompleted: false
    });

    // If multiple failures, maybe disable some features
    if (invoice.attempt_count > 3) {
      user.subscriptionStatus = 'past_due';
      await user.save();
    }

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
};
