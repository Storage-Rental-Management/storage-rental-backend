const Joi = require('joi');
const { MEETING_STATUS, MEETING_TYPES } = require('../constants/databaseEnums');

exports.createMeetingSchema = Joi.object({
    // organizerId: Joi.string().required().messages({
    //     'string.base': 'Organizer ID should be a string',
    //     'string.empty': 'Organizer ID cannot be empty',
    //     'any.required': 'Organizer ID is required'
    // }),
    // attendeeId: Joi.string().required().messages({
    //     'string.base': 'Attendee ID should be a string',
    //     'string.empty': 'Attendee ID cannot be empty',
    //     'any.required': 'Attendee ID is required'
    // }),
    unitId: Joi.string().required().messages({
        'string.base': 'Unit ID should be a string',
        'string.empty': 'Unit ID cannot be empty',
        'any.required': 'Unit ID is required'
    }),
    bookingId: Joi.string().optional().messages({
        'string.base': 'Booking ID should be a string',
        'string.empty': 'Booking ID cannot be empty',
        'any.required': 'Booking ID is required'
    }),
    title: Joi.string().optional().messages({
        'string.base': 'Title should be a string',
        'string.empty': 'Title cannot be empty',
        'any.required': 'Title is required'
    }),
    description: Joi.string().required().messages({
        'string.base': 'Description should be a string',
        'string.empty': 'Description cannot be empty',
        'any.required': 'Description is required'
    }),
    scheduledFor: Joi.date().required().messages({
        'date.base': 'Scheduled date must be a valid date',
        'any.required': 'Scheduled date is required'
    }),
    location: Joi.string().optional().messages({
        'string.base': 'Location should be a string'
    }),
    meetingType: Joi.string().valid(...Object.values(MEETING_TYPES)).required().messages({
        'any.only': 'Invalid meeting type',
        'any.required': 'Meeting type is required'
    }),
    phone: Joi.string().allow('', null), 
    meetLink: Joi.string().allow('', null),
    meetingStatus: Joi.string().valid(...Object.values(MEETING_STATUS)).default('scheduled').messages({
        'string.base': 'Status should be a string',
    })
});

exports.updateMeetingSchema = Joi.object({
    organizerId: Joi.string().optional().messages({
        'string.base': 'Organizer ID should be a string',
        'string.empty': 'Organizer ID cannot be empty'
    }),
    attendeeId: Joi.string().optional().messages({
        'string.base': 'Attendee ID should be a string',
        'string.empty': 'Attendee ID cannot be empty'
    }),
    unitId: Joi.string().optional().messages({
        'string.base': 'Unit ID should be a string',
        'string.empty': 'Unit ID cannot be empty'
    }),
    bookingId: Joi.string().optional().messages({
        'string.base': 'Booking ID should be a string',
        'string.empty': 'Booking ID cannot be empty'
    }),
    title: Joi.string().optional().messages({
        'string.base': 'Title should be a string',
        'string.empty': 'Title cannot be empty'
    }),
    description: Joi.string().optional().messages({
        'string.base': 'Description should be a string'
    }),
    scheduledFor: Joi.date().optional().messages({
        'date.base': 'Scheduled date must be a valid date'
    }),
    location: Joi.string().optional().messages({
        'string.base': 'Location should be a string'
    }),
    meetingType: Joi.string().valid(...Object.values(MEETING_TYPES)).optional().messages({
        'any.only': 'Invalid meeting type'
    }),
    phone: Joi.string().allow('', null), 
    meetLink: Joi.string().allow('', null),
    meetingStatus: Joi.string().valid(...Object.values(MEETING_STATUS)).default('meeting-requested').messages({
        'string.base': 'Status should be a string',
    })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});