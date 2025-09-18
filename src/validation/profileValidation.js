const Joi = require("joi");
const { USER_STATUS } = require("../constants/databaseEnums");

// exports.updateProfileSchema = Joi.object({
//     username: Joi.string().min(3).max(50).optional().messages({
//         'string.base': 'Username should be a type of text',
//         'string.empty': 'Username cannot be empty',
//         'string.min': 'Username should have at least {#limit} characters',
//         'string.max': 'Username should have at most {#limit} characters'
//     }),
//     email: Joi.string().email().required().messages({
//         'string.base': 'Email should be a type of text',
//         'string.empty': 'Email cannot be empty',
//         'string.email': 'Please enter a valid email address',
//         'any.required': 'Email is required'
//       }),
//     phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
//         'string.base': 'Phone number should be a type of text',
//         'string.empty': 'Phone number cannot be empty',
//         'string.pattern.base': 'Phone number must be 10 digits'
//     })
// });

exports.updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(50).optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  email: Joi.string().email().optional(),
  isBlocked: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .optional(),
});
