const Payment = require('../../models/payment');
const Booking = require('../../models/booking');
const User = require('../../models/user');
const CashPaymentRequest = require('../../models/cashPaymentRequest');
const { 
  createCheckoutSession, 
  calculateFees, 
  dollarsToCents,
  createCustomer
} = require('../../config/stripe');
const { v4: uuidv4 } = require('uuid');
const { PAYMENT_STATUS, PAYMENT_TYPE, PAYMENT_PERIOD } = require('../../constants/databaseEnums');
// const getPaymentTokensService = require('../profile/getPaymentTokensService');

module.exports = async (req, res) => {
  try {
    const { bookingId, paymentMethod, amount, currency, description, metadata = {} } = req.body;
    const payerId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate('unitId')
      .populate('propertyId')
      .populate('customerId');

    // const stripeCred = await getPaymentTokensService(booking.propertyId.ownerId);
    // if (!stripeCred || !stripeCred.secretKey) {
    //   return res.status(500).json({ message: 'Payment processing credentials not found. Please contact support.' });
    // }
    
    // Check for cash payment request
    const cashPaymentRequest = await CashPaymentRequest.findOne({
      bookingId: bookingId,
      userId: payerId
    });

    if (cashPaymentRequest) {
      if (cashPaymentRequest.status === 'approved') {
        return res.status(400).json({ 
          message: 'Cash payment request is approved. Please contact admin for cash payment instructions.' 
        });
      } else if (cashPaymentRequest.status === 'pending') {
        return res.status(400).json({ 
          message: 'Cash payment request is pending approval. Please wait for admin response or contact support.' 
        });
      }
      // If status is 'rejected', allow online payment to proceed
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId._id.toString() !== payerId) {
      return res.status(403).json({ message: 'You can only create payments for your own bookings' });
    }

    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already completed for this booking' });
    }

    // if (!['documents-approved', 'payment-pending'].includes(booking.bookingStatus)) {
    //   return res.status(400).json({ 
    //     message: 'Booking is not ready for payment. Documents must be approved first.' 
    //   });
    // }

    const storageUnit = booking.unitId;
    const storageProperty = booking.propertyId;
    const customer = booking.customerId;

    if (!storageUnit || !storageProperty) {
      return res.status(400).json({ message: 'Invalid storage unit or property' });
    }

    let calculatedAmount = amount;
    if (!calculatedAmount) {
      if (paymentMethod === 'monthly') {
        calculatedAmount = storageUnit.monthlyCharge;
        if (storageUnit.monthlyDiscount > 0) {
          calculatedAmount -= (calculatedAmount * storageUnit.monthlyDiscount / 100);
        }
      } else if (paymentMethod === 'yearly') {
        calculatedAmount = storageUnit.yearlyCharge;
        if (storageUnit.yearlyDiscount > 0) {
          calculatedAmount -= (calculatedAmount * storageUnit.yearlyDiscount / 100);
        }
      }
    }

    const fees = calculateFees(calculatedAmount);

    let stripeCustomerId = customer.stripeCustomerId;
    if (!stripeCustomerId) {
      try {
        const stripeCustomer = await createCustomer(customer.email, customer.username, {
          userId: customer._id.toString(),
          phone: customer.phone || ''
        });
        stripeCustomerId = stripeCustomer.id;

        await User.findByIdAndUpdate(customer._id, {
          stripeCustomerId
        });
      } catch (error) {
        return res.internalServerError({ message: 'Failed to create customer profile' });
      }
    }

    const paymentDescription = description || `Storage unit rental - ${storageUnit.name} at ${storageProperty.companyName}`;

    const stripeMetadata = {
      bookingId: bookingId,
      customerId: payerId,
      propertyOwnerId: storageProperty.ownerId.toString(),
      unitId: storageUnit._id.toString(),
      propertyId: storageProperty._id.toString(),
      paymentMethod: paymentMethod,
      ...metadata
    };

    // Always use only 'card' for payment method types for Stripe Checkout
    let paymentMethodTypes = ['card'];

    const stripeCheckoutSession = await createCheckoutSession({
      amount: calculatedAmount,
      currency: currency || 'inr',
      metadata: stripeMetadata,
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer: stripeCustomerId,
      payment_method_types: paymentMethodTypes,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency || 'inr',
          product_data: {
            name: `Storage Unit: ${storageUnit.name}`,
            description: `Storage unit rental at ${storageProperty.companyName}`,
          },
          unit_amount: dollarsToCents(calculatedAmount),
        },
        quantity: 1,
      }],
    });

    const transactionId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

    const superAdmin = await User.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (!superAdmin) {
      return res.internalServerError({ message: 'Super admin not found' });
    }

    const payment = new Payment({
      transactionId,
      stripeCheckoutSessionId: stripeCheckoutSession.id,
      bookingId,
      payerId,
      receiverId: superAdmin._id,
      unitId: storageUnit._id,
      propertyId: storageProperty._id,
      amount: dollarsToCents(calculatedAmount),
      currency,
      paymentMethod,
      paymentPeriod: PAYMENT_PERIOD[`${paymentMethod.toUpperCase()}`],
      baseAmount: dollarsToCents(calculatedAmount),
      platformFee: dollarsToCents(fees.platformFee),
      stripeFee: dollarsToCents(fees.stripeFee),
      netAmount: dollarsToCents(fees.netAmount),
      commission: dollarsToCents(fees.commission), 
      remainingAmount: dollarsToCents(fees.netAmount),
      status: PAYMENT_STATUS.PENDING,
      paymentType: PAYMENT_TYPE.PAYMENT,
      description: paymentDescription,
      metadata,
      paymentMethodType: null, // Will be set after payment completion
      paymentDate: null,
      refundedAt: null,
      failureReason: null,
      failureCode: null,
      invoiceLink: null
    });

    await payment.save();

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: PAYMENT_STATUS.PENDING,
      bookingStatus: 'payment-pending',
      payment_period: PAYMENT_PERIOD[`${paymentMethod.toUpperCase()}`]
    });

    return res.success({
      message: 'Checkout session created successfully',
      data: {
        transactionId,
        stripeCheckoutSessionId: stripeCheckoutSession.id,
        checkoutUrl: stripeCheckoutSession.url,
        amount: calculatedAmount,
        currency,
        status: payment.status,
        paymentMethod,
        netAmount: fees.netAmount,
        booking: {
          id: booking._id,
          unitName: storageUnit.name,
          propertyName: storageProperty.companyName,
          startDate: booking.startDate,
          endDate: booking.endDate
        }
      }
    });

  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to create checkout session",
    }); 
  }
};

