const Joi = require('joi');
const { DOCUMENT_TYPES, DOCUMENT_STATUS } = require('../constants/databaseEnums');

exports.uploadDocumentsSchema = Joi.object({
    unitId: Joi.string().required().messages({
        'string.base': 'Unit ID should be a string',
        'string.empty': 'Unit ID cannot be empty',
        'any.required': 'Unit ID is required'
    }),
    bookingId: Joi.string().optional().messages({
        'string.base': 'Booking ID should be a string'
    }),
    // Remove documentTypes validation since documents are handled via file uploads
    // The document types are extracted from file fieldnames like documents[Aadhar Card]
}).unknown(true); // Allow unknown fields for file uploads

exports.reviewDocumentSchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(DOCUMENT_STATUS))
        .required()
        .messages({
            'string.base': 'Status should be a string',
            'string.empty': 'Status cannot be empty',
            'any.only': `Status must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}`,
            'any.required': 'Status is required'
        }),
    comments: Joi.string()
        .optional()
        .allow('') // Allow empty comments
        .messages({
            'string.base': 'Comments should be a string'
        })
});

exports.resubmitDocumentSchema = Joi.object({
    unitId: Joi.string().required().messages({
        'string.base': 'Unit ID should be a string',
        'string.empty': 'Unit ID cannot be empty',
        'any.required': 'Unit ID is required'
    }),
    bookingId: Joi.string().optional().messages({
        'string.base': 'Booking ID should be a string'
    }),
    documentType: Joi.alternatives().try(
        Joi.string().valid(...Object.values(DOCUMENT_TYPES)),
        Joi.array().items(Joi.string().valid(...Object.values(DOCUMENT_TYPES)))
    ).optional().messages({
        'string.base': 'Document type should be a string',
        'array.base': 'Document types should be an array',
        'any.only': `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(', ')}`
    }),
    comments: Joi.string()
        .allow('')
        .optional()
        .messages({
            'string.base': 'Comments should be a string'
        })
}).unknown(true); // Allow unknown fields for file uploads

exports.updateDocumentSchema = Joi.object({
    documentType: Joi.alternatives().try(
        Joi.string().valid(...Object.values(DOCUMENT_TYPES)),
        Joi.array().items(Joi.string().valid(...Object.values(DOCUMENT_TYPES)))
    ).optional().messages({
        'string.base': 'Document type should be a string',
        'array.base': 'Document types should be an array',
        'any.only': `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(', ')}`
    }),
    status: Joi.string()
        .valid(...Object.values(DOCUMENT_STATUS))
        .optional()
        .messages({
            'string.base': 'Status should be a string',
            'any.only': `Status must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}`
        }),
    comments: Joi.string()
        .allow('')
        .optional()
        .messages({
            'string.base': 'Comments should be a string'
        })
}).min(1) // At least one field must be provided for update
  .messages({
      'object.min': 'At least one field must be provided for update'
  });

// Additional schema for validating individual document types during file processing
exports.validateDocumentType = (documentType) => {
    const schema = Joi.string().valid(...Object.values(DOCUMENT_TYPES));
    return schema.validate(documentType);
};

// Schema for validating the extracted document map
exports.validateDocumentMap = Joi.object().pattern(
    Joi.string().valid(...Object.values(DOCUMENT_TYPES)), // Keys must be valid document types
    Joi.array().items(Joi.string().uri({ relativeOnly: true })) // Values must be arrays of relative URLs
).min(1).messages({
    'object.min': 'At least one document must be uploaded',
    'object.pattern.match': `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(', ')}`
});

// Schema for validating file uploads (can be used in middleware)
exports.fileUploadSchema = Joi.object({
    fieldname: Joi.string().pattern(/^documents\[.+\]$/).required().messages({
        'string.pattern.base': 'Field name must follow the pattern: documents[DocumentType]'
    }),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'application/pdf').required().messages({
        'any.only': 'File type must be JPEG, PNG, or PDF'
    }),
    size: Joi.number().max(10 * 1024 * 1024).required().messages({ // 10MB limit
        'number.max': 'File size must not exceed 10MB'
    })
});