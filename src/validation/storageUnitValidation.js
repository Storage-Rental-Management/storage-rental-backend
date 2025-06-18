const Joi = require('joi');
const { STORAGE_UNIT_STATUS, STORAGE_UNIT_TYPES } = require('../constants/databaseEnums');
 

exports.storageUnitSchema = Joi.object({
  propertyId: Joi.string().required().messages({
    'string.base': 'Property ID should be a type of text',
    'string.empty': 'Property ID cannot be empty',
    'any.required': 'Property ID is required'
  }),
  name: Joi.string().required().messages({
    'string.base': 'Name should be a type of text',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required'
  }),
  unitType: Joi.string().valid(...Object.values(STORAGE_UNIT_TYPES)).required().messages({
    'string.base': 'Unit type should be a type of text',
    'string.empty': 'Unit type cannot be empty',
    'any.required': 'Unit type is required'
  }),
  size: Joi.string().required().messages({
    'string.base': 'Size should be a type of text',
    'string.empty': 'Size cannot be empty',
    'any.required': 'Size is required'
  }),
  pricingProfileId: Joi.string().required().messages({
    'string.base': 'Pricing Profile ID should be a type of text',
    'string.empty': 'Pricing Profile ID cannot be empty',
    'any.required': 'Pricing Profile ID is required'
  }),
  yearlyCharge: Joi.number().optional().messages({
    'number.base': 'Yearly charge should be a number'
  }),
  yearlyDiscount: Joi.number().default(0).messages({
    'number.base': 'Yearly discount should be a number'
  }),
  monthlyCharge: Joi.number().optional().messages({
    'number.base': 'Monthly charge should be a number'
  }),
  monthlyDiscount: Joi.number().default(0).messages({
    'number.base': 'Monthly discount should be a number'
  }),
  status: Joi.string()
  .valid(...Object.values(STORAGE_UNIT_STATUS))
  .required()
  .messages({
    'any.only': `Status must be one of: ${Object.values(STORAGE_UNIT_STATUS).join(', ')}`,
    'any.required': 'Status is required'
  }),
  paymentMethod: Joi.string().required().messages({
    'string.base': 'Payment method should be a type of text',
    'string.empty': 'Payment method cannot be empty',
    'any.required': 'Payment method is required'
  }),
  unitImage: Joi.string().optional().messages({
    'string.base': 'Unit image should be a string (URL/path)'
  }),
  requiredDocuments: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'DocumentsId should be an array of strings',
    'string.base': 'Each documentId should be a string'
  }),
  description: Joi.string().allow('').optional(),
  isAvailable: Joi.boolean().optional()
});

exports.storageUnitUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  unitType: Joi.string().valid(...Object.values(STORAGE_UNIT_TYPES)).optional(),
  size: Joi.string().optional(),
  pricingProfileId: Joi.string().optional(),
  yearlyCharge: Joi.number().optional(),
  yearlyDiscount: Joi.number().optional(),
  monthlyCharge: Joi.number().optional(),
  monthlyDiscount: Joi.number().optional(),
  status: Joi.string()
  .valid(...Object.values(STORAGE_UNIT_STATUS))
  .optional(),
  paymentMethod: Joi.string().optional(),
  unitImage: Joi.string().optional(),
  requiredDocuments: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().allow('').optional(),
  isAvailable: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});