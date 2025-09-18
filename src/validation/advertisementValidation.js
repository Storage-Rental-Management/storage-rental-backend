const Joi = require('joi');
const { AD_STATUS } = require('../constants/databaseEnums');

exports.createAdvertisementSchema = Joi.object({
    adTitle: Joi.string()
        .required()
        .messages({
            'string.base': 'Advertisement title should be a string',
            'string.empty': 'Advertisement title cannot be empty',
            'any.required': 'Advertisement title is required'
        }),
    adImages: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
        .messages({
            'array.base': 'Images should be an array',
            'array.min': 'At least one image is required',
            'any.required': 'Images are required'
        }),
    redirectUrl: Joi.string()
        .uri()
        .required()
        .messages({
            'string.base': 'Redirect URL should be a string',
            'string.empty': 'Redirect URL cannot be empty',
            'string.uri': 'Redirect URL must be a valid URL',
            'any.required': 'Redirect URL is required'
        }),
    startDate: Joi.date()
        .min('now')
        .required()
        .messages({
            'date.base': 'Start date must be a valid date',
            'date.min': 'Start date must be in the future',
            'any.required': 'Start date is required'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .required()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date',
            'any.required': 'End date is required'
        }),
    description: Joi.string()
        .allow('')
        .optional()
        .messages({
            'string.base': 'Description should be a string'
        })
});

exports.updateAdvertisementSchema = Joi.object({
    adTitle: Joi.string()
        .optional()
        .messages({
            'string.base': 'Advertisement title should be a string',
            'string.empty': 'Advertisement title cannot be empty'
        }),
    adImages: Joi.array()
        .items(Joi.string())
        .min(1)
        .optional()
        .messages({
            'array.base': 'Images should be an array',
            'array.min': 'At least one image is required'
        }),
    redirectUrl: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.base': 'Redirect URL should be a string',
            'string.uri': 'Redirect URL must be a valid URL'
        }),
    startDate: Joi.date()
        .min('now')
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date',
            'date.min': 'Start date must be in the future'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        }),
    description: Joi.string()
        .allow('')
        .optional()
        .messages({
            'string.base': 'Description should be a string'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

exports.updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(AD_STATUS))
        .required()
        .messages({
            'string.base': 'Status should be a string',
            'string.empty': 'Status cannot be empty',
            'any.only': `Status must be one of: ${Object.values(AD_STATUS).join(', ')}`,
            'any.required': 'Status is required'
        })
});

exports.searchAdvertisementSchema = Joi.object({
    search: Joi.string()
        .allow('')
        .optional()
        .messages({
            'string.base': 'Search query should be a string'
        }),
    status: Joi.string()
        .valid(...Object.values(AD_STATUS))
        .optional()
        .messages({
            'string.base': 'Status should be a string',
            'any.only': `Status must be one of: ${Object.values(AD_STATUS).join(', ')}`
        }),
    startDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        }),
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        })
}); 