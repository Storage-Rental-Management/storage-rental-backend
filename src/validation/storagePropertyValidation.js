const Joi = require('joi');

exports.storagePropertySchema = Joi.object({
  companyName: Joi.string().required().messages({
    'string.base': 'Company name should be a type of text',
    'string.empty': 'Company name cannot be empty',
    'any.required': 'Company name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email should be a type of text',
    'string.empty': 'Email cannot be empty',
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),
  mobileNumber: Joi.string().pattern(/^\d{10}$/).required().messages({
    'string.base': 'Mobile number should be a type of text',
    'string.empty': 'Mobile number cannot be empty',
    'string.pattern.base': 'Mobile number must be 10 digits',
    'any.required': 'Mobile number is required'
  }),
  address: Joi.string().required().messages({
    'string.base': 'Address should be a type of text',
    'string.empty': 'Address cannot be empty',
    'any.required': 'Address is required'
  }),
  propertyImage: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Property images should be an array',
    'string.base': 'Each image should be a string (URL/path)'
  })
});

exports.storagePropertyDeleteSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.base': 'ID should be a type of text',
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required'
  })
});

exports.storagePropertyUpdateSchema = Joi.object({
  companyName: Joi.string().optional().messages({
    'string.base': 'Company name should be a type of text'
  }),
  email: Joi.string().email().optional().messages({
    'string.base': 'Email should be a type of text',
    'string.email': 'Please enter a valid email address'
  }),
  mobileNumber: Joi.string().pattern(/^\d{10}$/).optional().messages({
    'string.base': 'Mobile number should be a type of text',
    'string.pattern.base': 'Mobile number must be 10 digits'
  }),
  address: Joi.string().optional().messages({
    'string.base': 'Address should be a type of text'
  }),
  propertyImage: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Property images should be an array',
    'string.base': 'Each image should be a string (URL/path)'
  })
}).or('companyName', 'email', 'mobileNumber', 'address', 'propertyImage').messages({
  'object.missing': 'At least one field (companyName, email, mobileNumber, address, or propertyImage) must be provided'
});