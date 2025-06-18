const Joi = require('joi');

exports.pricingProfileSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.base': 'Name should be a type of text',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required'
  }),
  yearlyCharge: Joi.number().required().messages({
    'number.base': 'Yearly charge should be a number',
    'any.required': 'Yearly charge is required'
  }),
  yearlyDiscount: Joi.number().default(0).messages({
    'number.base': 'Yearly discount should be a number'
  }),
  monthlyCharge: Joi.number().required().messages({
    'number.base': 'Monthly charge should be a number',
    'any.required': 'Monthly charge is required'
  }),
  monthlyDiscount: Joi.number().default(0).messages({
    'number.base': 'Monthly discount should be a number'
  }),
  isActive: Joi.boolean().optional()
});

exports.pricingProfileUpdateSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Name should be a type of text',
    'string.empty': 'Name cannot be empty'
  }),
  yearlyCharge: Joi.number().optional().messages({
    'number.base': 'Yearly charge should be a number'
  }),
  yearlyDiscount: Joi.number().optional().messages({
    'number.base': 'Yearly discount should be a number'
  }),
  monthlyCharge: Joi.number().optional().messages({
    'number.base': 'Monthly charge should be a number'
  }),
  monthlyDiscount: Joi.number().optional().messages({
    'number.base': 'Monthly discount should be a number'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive should be true or false'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});