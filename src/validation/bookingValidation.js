const Joi = require('joi');
const {BOOKING_STATUS, CASH_PAYMENT_REQUEST_STATUS, PAYMENT_PERIOD} = require('../constants/databaseEnums')

exports.createBookingSchema = Joi.object({
  unitId: Joi.string().required(),
  propertyId: Joi.string().required(),
  // customerId: Joi.string().required(),
  meetingId: Joi.string().optional(),
  documentId: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  totalAmount: Joi.number().optional(),
  bookingStatus: Joi.string().valid(...Object.values(BOOKING_STATUS)).optional()
});

exports.updateBookingSchema = Joi.object({
    unitId: Joi.string().optional(),
    propertyId: Joi.string().optional(),
    // customerId: Joi.string().optional(),
    meetingId: Joi.string().optional(),
    documentId: Joi.array().items(Joi.string()).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    totalAmount: Joi.number().optional(),
    bookingStatus: Joi.string().valid(...Object.values(BOOKING_STATUS)).optional()}
).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

exports.manualUnitAssignmentSchema = {
  unitId: {
    in: ['body'],
    isMongoId: true,
    errorMessage: 'Valid unit ID is required'
  },
  username: {
    in: ['body'],
    notEmpty: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Username must be between 2 and 50 characters'
    },
    errorMessage: 'Username is required'
  },
  email: {
    in: ['body'],
    isEmail: true,
    normalizeEmail: true,
    errorMessage: 'Valid email is required'
  },
  phone: {
    in: ['body'],
    notEmpty: true,
    isMobilePhone: true,
    errorMessage: 'Valid phone number is required'
  },
  paymentMethod: {
    in: ['body'],
    isIn: {
      options: [['monthly', 'yearly']],
      errorMessage: 'Payment method must be either monthly or yearly'
    },
    errorMessage: 'Payment method is required'
  },
  startDate: {
    in: ['body'],
    optional: true,
    isISO8601: true,
    toDate: true,
    errorMessage: 'Start date must be a valid date'
  },
  endDate: {
    in: ['body'],
    optional: true,
    isISO8601: true,
    toDate: true,
    errorMessage: 'End date must be a valid date'
  },
  totalAmount: {
    in: ['body'],
    optional: true,
    isNumeric: true,
    toFloat: true,
    errorMessage: 'Total amount must be a valid number'
  }
};

exports.createCashPaymentRequestSchema = Joi.object({
  bookingId: Joi.string().required(),
  payment_period: Joi.string().valid(...Object.values(PAYMENT_PERIOD)).required()
});

exports.actionCashPaymentRequestSchema = Joi.object({
  requestId: Joi.string().required(),
  action: Joi.string().valid(...Object.values(CASH_PAYMENT_REQUEST_STATUS).filter(v => v !== 'pending')).required(),
  reason: Joi.string().allow('', null),
  notificationId: Joi.string().optional()
});
