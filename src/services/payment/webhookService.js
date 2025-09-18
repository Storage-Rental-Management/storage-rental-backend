const Payment = require("../../models/payment");
const Booking = require("../../models/booking");
const Notification = require("../../models/notification");
const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const User = require("../../models/user");
const Subscription = require('../../models/subscriptions');
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
    // Handle the event
    if (event.account) {
      // Connected account event (e.g., payout for admin)
      const connectedAccountId = event.account;
      switch (event.type) {
        case "payout.paid":
          console.log("✅ Payout paid (connected account):", {
            id: event.data.object.id,
            amount: event.data.object.amount,
            arrival_date: event.data.object.arrival_date,
            connectedAccountId,
          });
          await handlePayoutPaid(event.data.object, connectedAccountId);
          break;
        case "payout.failed":
          console.log("❌ Payout failed (connected account):", {
            id: event.data.object.id,
            amount: event.data.object.amount,
            failure_code: event.data.object.failure_code,
            failure_message: event.data.object.failure_message,
            connectedAccountId,
          });
          await handlePayoutFailed(event.data.object, connectedAccountId);
          break;
        // Add more connected account event types as needed
        default:
          console.log(`Unhandled connected account event type: ${event.type}`);
      }
    } else {
      // Platform account event (existing logic)
      switch (event.type) {
        case "checkout.session.completed":
          console.log("💰 Checkout session completed");
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case "checkout.session.expired":
          console.log("⏰ Checkout session expired");
          await handleCheckoutSessionExpired(event.data.object);
          break;
        case "checkout.session.async_payment_succeeded":
          console.log("✅ Async payment succeeded");
          await handleAsyncPaymentSucceeded(event.data.object);
          break;
        case "checkout.session.async_payment_failed":
          console.log("❌ Async payment failed");
          await handleAsyncPaymentFailed(event.data.object);
          break;
        case "charge.succeeded":
          console.log("💳 Charge succeeded");
          await handleChargeSucceeded(event.data.object);
          break;
        case "charge.failed":
          console.log("❌ Charge failed");
          await handleChargeFailed(event.data.object);
          break;
        case "charge.refunded":
          console.log("🔄 Charge refunded");
          await handleChargeRefunded(event.data.object);
          break;
        case "transfer.created":
          console.log("🔄 Transfer created:", event.data.object.id);
          break;
        case "transfer.paid":
          console.log("✅ Transfer paid:", event.data.object.id);
          break;
        case "payout.created":
          console.log("💸 Payout created:", {
            id: event.data.object.id,
            amount: event.data.object.amount,
            currency: event.data.object.currency,
            status: event.data.object.status,
          });
          break;
        case "payout.paid":
          console.log("✅ Payout paid:", {
            id: event.data.object.id,
            amount: event.data.object.amount,
            arrival_date: event.data.object.arrival_date,
          });
          await handlePayoutPaid(event.data.object);
          break;
        case "payout.failed":
          console.log("❌ Payout failed:", {
            id: event.data.object.id,
            amount: event.data.object.amount,
            failure_code: event.data.object.failure_code,
            failure_message: event.data.object.failure_message,
          });
          await handlePayoutFailed(event.data.object);
          break;
        case "payout.canceled":
          console.log("🚫 Payout canceled:", event.data.object.id);
          break;

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
    }

    console.log("✅ Webhook processed successfully");
    return res.json({ received: true });
  } catch (err) {
    return res.internalServerError({
      message: err.message || "Webhook Processing Failed",
    });
  }
};

// Handle successful checkout session
const handleCheckoutSessionCompleted = async (session) => {
  try {
    const payment = await Payment.findOne({
      stripeCheckoutSessionId: session.id,
    })
      .populate("bookingId")
      .populate("unitId")
      .populate("payerId")
      .populate("receiverId");

    if (!payment) {
      console.error("Payment not found for checkout session:", session.id);
      return;
    }

    // Get payment method type from PaymentIntent
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );
      payment.paymentMethodType = paymentIntent.payment_method_types[0];
    }

    // Update payment status
    payment.status = PAYMENT_STATUS.SUCCEEDED;
    payment.paymentDate = new Date();
    payment.stripeChargeId = session.payment_intent
      ? session.payment_intent
      : null;
    // --- Generate Invoice PDF ---
    const invoiceUrl = await generateInvoicePDF(payment);
    
    payment.invoiceLink = session.invoice
    ? session.invoice.hosted_invoice_url
    : invoiceUrl;
    await payment.save();

    // Set startDate to now and endDate to 1 year after
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    // Update booking status to 'booking-confirmed' and set dates
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: PAYMENT_STATUS.SUCCEEDED,
      bookingStatus: BOOKING_STATUS.BOOKING_CONFIRMED,
      totalAmount: centsToDollars(payment.amount),
      payment_period: payment.paymentMethod,
      startDate: startDate,
      endDate: endDate,
    });

    // Update storage unit status to 'occupied'
    await StorageUnit.findByIdAndUpdate(payment.unitId, {
      status: STORAGE_UNIT_STATUS.OCCUPIED,
    });

    await StorageProperty.findByIdAndUpdate(
      payment.propertyId,
      { $inc: { activeCount: 1 } },
      { new: true }
    );

    // Create success notification for customer
    await sendNotification({
      recipientId: payment.payerId._id,
      title: "Payment Successful",
      message: `Thank you for your payment of ₹${centsToDollars(
        payment.amount
      )} for ${
        payment.unitId.name
      }. Your booking is now confirmed! If you have any questions, we're here to help.`,
      type: NOTIFICATION_TYPE.PAYMENT_COMPLETED,
      group: "Payment",
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        amount: centsToDollars(payment.amount),
        paymentType: payment.paymentType,
        actionButtons: ["view_receipt"],
        unitId: payment.unitId,
      },
      isAction: true,
      isActionCompleted: false,
    });

    // Create notification for property owner
    await sendNotification({
      recipientId: payment.receiverId._id,
      title: "Payment Received",
      message: `Thank you for your payment of ₹${centsToDollars(
        payment.amount
      )} for ${payment.unitId.name}.`,
      type: NOTIFICATION_TYPE.RENTAL_PAYMENT_RECEIVED,
      group: "Payment",
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: {
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        netAmount: centsToDollars(payment.netAmount),
        payerId: payment.payerId,
        paymentType: payment.paymentType,
        actionButtons: ["view_receipt"],
        unitId: payment.unitId,
      },
      isAction: true,
      isActionCompleted: false,
    });
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
};

// Handle expired checkout session
const handleCheckoutSessionExpired = async (session) => {
  try {
    const payment = await Payment.findOne({
      stripeCheckoutSessionId: session.id,
    })
      .populate("bookingId")
      .populate("unitId")
      .populate("payerId");

    if (!payment) {
      console.error("Payment not found for checkout session:", session.id);
      return;
    }

    // Update payment status
    payment.status = PAYMENT_STATUS.CANCELLED;
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: PAYMENT_STATUS.PENDING,
      bookingStatus: BOOKING_STATUS.PAYMENT_PENDING,
    });

    // Create expiration notification for customer
    await sendNotification({
      recipientId: payment.payerId,
      title: "Payment Session Expired",
      message: `Your payment session for ₹${centsToDollars(
        payment.amount
      )} for ${
        payment.unitId.name
      } has expired. Please try again if you still want to complete your booking.`,
      type: NOTIFICATION_TYPE.PAYMENT_FAILED,
      group: "Payment",
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: {
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        amount: centsToDollars(payment.amount),
        paymentType: payment.paymentType,
        actionButtons: ["contact_support"],
        unitId: payment.unitId,
      },
      isAction: true,
      isActionCompleted: false,
    });
  } catch (error) {
    console.error("Error handling checkout session expired:", error);
  }
};

// Handle async payment succeeded
const handleAsyncPaymentSucceeded = async (session) => {
  try {
    const payment = await Payment.findOne({
      stripeCheckoutSessionId: session.id,
    })
      .populate("bookingId")
      .populate("unitId")
      .populate("payerId")
      .populate("receiverId");

    if (!payment) {
      console.error("Payment not found for checkout session:", session.id);
      return;
    }

    // Get payment method type from PaymentIntent
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );
      payment.paymentMethodType = paymentIntent.payment_method_types[0];
    }

    // Update payment status
    payment.status = PAYMENT_STATUS.SUCCEEDED;
    payment.paymentDate = new Date();

    // --- Generate Invoice PDF ---
    const invoiceUrl = await generateInvoicePDF(payment);
    payment.invoiceLink = invoiceUrl;

    await payment.save();

    // Set startDate to now and endDate to 1 year after
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: PAYMENT_STATUS.SUCCEEDED,
      bookingStatus: BOOKING_STATUS.BOOKING_CONFIRMED,
      totalAmount: centsToDollars(payment.amount),
      payment_period: payment.paymentMethod,
      startDate: startDate,
      endDate: endDate,
    });

    // Update storage unit status
    await StorageUnit.findByIdAndUpdate(payment.unitId, {
      status: STORAGE_UNIT_STATUS.OCCUPIED,
    });

    await StorageProperty.findByIdAndUpdate(
      payment.propertyId,
      { $inc: { activeCount: 1 } },
      { new: true }
    );

    // Create success notification for customer
    await sendNotification({
      recipientId: payment.payerId._id,
      title: "Payment Successful",
      message: `Your payment of ₹${centsToDollars(payment.amount)} for ${
        payment.unitId.name
      } has been processed successfully! Your booking is now confirmed.`,
      type: NOTIFICATION_TYPE.PAYMENT_COMPLETED,
      group: "Payment",
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        amount: centsToDollars(payment.amount),
        paymentType: payment.paymentType,
        actionButtons: ["view_receipt"],
        unitId: payment.unitId,
      },
      isAction: true,
      isActionCompleted: false,
    });
  } catch (error) {
    console.error("Error handling async payment succeeded:", error);
  }
};

// Handle async payment failed
const handleAsyncPaymentFailed = async (session) => {
  try {
    const payment = await Payment.findOne({
      stripeCheckoutSessionId: session.id,
    })
      .populate("bookingId")
      .populate("unitId")
      .populate("payerId");

    if (!payment) {
      console.error("Payment not found for checkout session:", session.id);
      return;
    }

    // Update payment status
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = "Async payment failed";
    payment.failureCode = "async_payment_failed";
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: PAYMENT_STATUS.FAILED,
      bookingStatus: BOOKING_STATUS.PAYMENT_PENDING,
    });

    // Create failure notification for customer
    await sendNotification({
      recipientId: payment.payerId,
      title: "Payment Failed",
      message: `Your payment of ₹${centsToDollars(payment.amount)} for ${
        payment.unitId.name
      } has failed. Please try again or contact support for assistance.`,
      type: NOTIFICATION_TYPE.PAYMENT_FAILED,
      group: "Payment",
      priority: NOTIFICATION_PRIORITY.HIGH,
      metadata: {
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        amount: centsToDollars(payment.amount),
        failureReason: payment.failureReason,
        paymentType: payment.paymentType,
        actionButtons: ["contact_support"],
        unitId: payment.unitId,
      },
      isAction: true,
      isActionCompleted: false,
    });
  } catch (error) {
    console.error("Error handling async payment failed:", error);
  }
};

// Handle successful charge
const handleChargeSucceeded = async (charge) => {
  try {
    const payment = await Payment.findOne({
      stripeChargeId: charge.id,
    });

    if (payment && payment.status !== PAYMENT_STATUS.SUCCEEDED) {
      payment.status = PAYMENT_STATUS.SUCCEEDED;
      payment.paymentDate = new Date();
      payment.invoiceLink = charge.receipt_url; // Store the Stripe receipt link
      await payment.save();
    }
  } catch (error) {
    console.error("Error handling charge succeeded:", error);
  }
};

// Handle failed charge
const handleChargeFailed = async (charge) => {
  try {
    const payment = await Payment.findOne({
      stripeChargeId: charge.id,
    });

    if (payment && payment.status !== PAYMENT_STATUS.FAILED) {
      payment.status = PAYMENT_STATUS.FAILED;
      payment.failureReason = charge.failure_message || "Charge failed";
      payment.failureCode = charge.failure_code || "unknown_error";
      await payment.save();
    }
  } catch (error) {
    console.error("Error handling charge failed:", error);
  }
};

// Handle refunded charge
const handleChargeRefunded = async (charge) => {
  try {
    const payment = await Payment.findOne({
      stripeChargeId: charge.id,
    });

    if (payment) {
      payment.status = PAYMENT_STATUS.REFUNDED;
      payment.refundedAt = new Date();
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        bookingStatus: BOOKING_STATUS.BOOKING_CANCELLED,
      });

      // Update storage unit status
      await StorageUnit.findByIdAndUpdate(payment.unitId, {
        status: STORAGE_UNIT_STATUS.AVAILABLE,
      });

      await StorageProperty.findByIdAndUpdate(
        payment.propertyId,
        { $inc: { activeCount: -1 } },
        { new: true }
      );
    }
  } catch (error) {
    console.error("Error handling charge refunded:", error);
  }
};

// Handle payout webhooks
const handlePayoutPaid = async (payout, connectedAccountId) => {
  try {
    // Mark all associated payments as paid
    await Payment.updateMany(
      { stripePayoutId: payout.id, paymentType: "payout" },
      { status: "paid" }
    );
    console.log(
      "Payout marked as paid:",
      payout.id,
      connectedAccountId ? `(Connected Account: ${connectedAccountId})` : ""
    );

    // Fetch all payments linked to this payout
    const paidPayouts = await Payment.find({
      stripePayoutId: payout.id,
      paymentType: "payout",
    }).populate({
      path: "receiverId",
      populate: { path: "role" },
    });

    const superAdmin = await User.findOne({
      email: process.env.SUPER_ADMIN_EMAIL,
    });

    for (const paid of paidPayouts) {
      const receiver = paid.receiverId;
      if (receiver?.role?.name === "Admin") {
        await sendNotification({
          recipientId: receiver._id,
          title: "Payout Received",
          message: `Your payout of $${(paid.amount / 100).toFixed(
            2
          )} is on its way to your account. Thank you for using our platform!`,
          type: NOTIFICATION_TYPE.PAYOUT_COMPLETED,
          group: "Payment",
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: {
            transactionId: paid.transactionId,
            amount: paid.amount / 100,
            payoutId: payout.id,
            actionButtons: ["view_receipt"],
            payoutRequestId: paid._id,
            unitId: paid.unitId,
          },
          isAction: true,
          isActionCompleted: false,
        });
      } else {
        console.log("ℹ️ Skipping notification: receiver is not an admin");
      }
      // Always notify superadmin
      if (superAdmin) {
        await sendNotification({
          recipientId: superAdmin._id,
          title: "Payout Completed (Admin)",
          message: `A payout of $${(paid.amount / 100).toFixed(
            2
          )} has been completed for admin ${receiver.username}.`,
          type: NOTIFICATION_TYPE.PAYOUT_COMPLETED,
          group: "Payment",
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: {
            transactionId: paid.transactionId,
            amount: paid.amount / 100,
            payoutId: payout.id,
            actionButtons: ["view_receipt"],
            payoutRequestId: paid._id,
            unitId: paid.unitId,
            adminId: receiver._id,
          },
          isAction: true,
          isActionCompleted: false,
        });
      }
    }
  } catch (err) {
    console.error("Error updating payout status:", err);
    return res.status(500).send("Error updating payout status");
  }
};

const handlePayoutFailed = async (payout, connectedAccountId) => {
  try {
    await Payment.updateMany(
      { stripePayoutId: payout.id },
      { status: "failed" }
    );
    console.log(
      "Payout marked as failed:",
      payout.id,
      connectedAccountId ? `(Connected Account: ${connectedAccountId})` : ""
    );
  } catch (err) {
    return res.status(500).send("Error updating payout status");
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
