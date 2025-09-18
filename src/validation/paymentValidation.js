const Joi = require('joi');
const { PAYMENT_PERIOD, PAYMENT_STATUS } = require('../constants/databaseEnums');

// Validation schema for creating a payment intent
exports.createPaymentIntentSchema = Joi.object({
  bookingId: Joi.string().required().messages({
    'string.base': 'Booking ID should be a string',
    'string.empty': 'Booking ID cannot be empty',
    'any.required': 'Booking ID is required'
  }),
  paymentMethod: Joi.string().valid(...Object.values(PAYMENT_PERIOD)).required().messages({
    'string.base': 'Payment method should be a string',
    'string.empty': 'Payment method cannot be empty',
    'any.only': 'Payment method must be either monthly or yearly',
    'any.required': 'Payment method is required'
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount should be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  paymentIntentId: Joi.string().optional().messages({
    'string.base': 'Payment Intent ID should be a string',
    'string.empty': 'Payment Intent ID cannot be empty',
    'any.required': 'Payment Intent ID is required'
  }),
  currency: Joi.string().default('inr').messages({
    'string.base': 'Currency should be a string'
  }),
  description: Joi.string().optional().messages({
    'string.base': 'Description should be a string'
  }),
  metadata: Joi.object().optional().messages({
    'object.base': 'Metadata should be an object'
  })
});

// Validation schema for confirming a payment (server-side)
exports.confirmPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().optional().messages({
    'string.base': 'Payment Intent ID should be a string',
    'string.empty': 'Payment Intent ID cannot be empty',
    'any.required': 'Payment Intent ID is required'
  }),
  paymentMethodId: Joi.string().optional().messages({
    'string.base': 'Payment Method ID should be a string',
    'string.empty': 'Payment Method ID cannot be empty',
    'any.required': 'Payment Method ID is required'
  })
});

// Validation schema for confirming a payment (client-side)
exports.confirmPaymentClientSchema = Joi.object({
  paymentIntentId: Joi.string().optional().messages({
    'string.base': 'Payment Intent ID should be a string',
    'string.empty': 'Payment Intent ID cannot be empty',
    'any.required': 'Payment Intent ID is required'
  })
});

// Validation schema for capturing a payment
exports.capturePaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required().messages({
    'string.base': 'Payment Intent ID should be a string',
    'string.empty': 'Payment Intent ID cannot be empty',
    'any.required': 'Payment Intent ID is required'
  }),
  amount: Joi.number().positive().optional().messages({
    'number.base': 'Amount should be a number',
    'number.positive': 'Amount must be positive'
  })
});

// Validation schema for cancelling a payment
exports.cancelPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required().messages({
    'string.base': 'Payment Intent ID should be a string',
    'string.empty': 'Payment Intent ID cannot be empty',
    'any.required': 'Payment Intent ID is required'
  }),
  reason: Joi.string().valid('requested_by_customer', 'duplicate', 'fraudulent').default('requested_by_customer').messages({
    'string.base': 'Reason should be a string',
    'any.only': 'Reason must be one of: requested_by_customer, duplicate, fraudulent'
  })
});

// Validation schema for creating a refund
exports.createRefundSchema = Joi.object({
  chargeId: Joi.string().required().messages({
    'string.base': 'Charge ID should be a string',
    'string.empty': 'Charge ID cannot be empty',
    'any.required': 'Charge ID is required'
  }),
  amount: Joi.number().positive().optional().messages({
    'number.base': 'Amount should be a number',
    'number.positive': 'Amount must be positive'
  }),
  reason: Joi.string().valid('requested_by_customer', 'duplicate', 'fraudulent').default('requested_by_customer').messages({
    'string.base': 'Reason should be a string',
    'any.only': 'Reason must be one of: requested_by_customer, duplicate, fraudulent'
  })
});

// Validation schema for getting payment details
exports.getPaymentSchema = Joi.object({
  paymentId: Joi.string().required().messages({
    'string.base': 'Payment ID should be a string',
    'string.empty': 'Payment ID cannot be empty',
    'any.required': 'Payment ID is required'
  })
});

// Validation schema for getting payments by booking
exports.getPaymentsByBookingSchema = Joi.object({
  bookingId: Joi.string().required().messages({
    'string.base': 'Booking ID should be a string',
    'string.empty': 'Booking ID cannot be empty',
    'any.required': 'Booking ID is required'
  })
});

// Validation schema for getting payments by user
exports.getPaymentsByUserSchema = Joi.object({
  userId: Joi.string().optional().messages({
    'string.base': 'User ID should be a string'
  }),
  status: Joi.string().valid(...Object.values(PAYMENT_STATUS)).optional().messages({
    'string.base': 'Status should be a string',
    'any.only': 'Status must be one of: pending, processing, succeeded, failed, cancelled, refunded'
  }),
  startDate: Joi.date().optional().messages({
    'date.base': 'Start date should be a valid date'
  }),
  endDate: Joi.date().optional().messages({
    'date.base': 'End date should be a valid date'
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page should be a number',
    'number.integer': 'Page should be an integer',
    'number.min': 'Page should be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit should be a number',
    'number.integer': 'Limit should be an integer',
    'number.min': 'Limit should be at least 1',
    'number.max': 'Limit should be at most 100'
  })
});

// Validation schema for webhook events
exports.webhookSchema = Joi.object({
  type: Joi.string().required().messages({
    'string.base': 'Event type should be a string',
    'string.empty': 'Event type cannot be empty',
    'any.required': 'Event type is required'
  }),
  data: Joi.object().required().messages({
    'object.base': 'Event data should be an object',
    'any.required': 'Event data is required'
  })
});

// Validation schema for updating payment status
exports.updatePaymentStatusSchema = Joi.object({
  paymentId: Joi.string().required().messages({
    'string.base': 'Payment ID should be a string',
    'string.empty': 'Payment ID cannot be empty',
    'any.required': 'Payment ID is required'
  }),
  status: Joi.string().valid('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded').required().messages({
    'string.base': 'Status should be a string',
    'string.empty': 'Status cannot be empty',
    'any.only': 'Status must be one of: pending, processing, succeeded, failed, cancelled, refunded',
    'any.required': 'Status is required'
  }),
  failureReason: Joi.string().optional().messages({
    'string.base': 'Failure reason should be a string'
  }),
  failureCode: Joi.string().optional().messages({
    'string.base': 'Failure code should be a string'
  })
}); 