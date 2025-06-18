const Joi = require('joi');
const {BOOKING_STATUS} = require('../constants/databaseEnums')

exports.createBookingSchema = Joi.object({
  unitId: Joi.string().required(),
  propertyId: Joi.string().required(),
  customerId: Joi.string().required(),
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
    customerId: Joi.string().optional(),
    meetingId: Joi.string().optional(),
    documentId: Joi.array().items(Joi.string()).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    totalAmount: Joi.number().optional(),
    bookingStatus: Joi.string().valid(...Object.values(BOOKING_STATUS)).optional()}
).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});