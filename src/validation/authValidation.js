const Joi = require("joi");
const { AUTH_PROVIDER } = require("../constants/databaseEnums");

exports.registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    "string.base": "Username should be a type of text",
    "string.empty": "Username cannot be empty",
    "string.min": "Username should have at least {#limit} characters",
    "string.max": "Username should have at most {#limit} characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "string.base": "Email should be a type of text",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  role: Joi.string().valid("User", "Admin").default("User").messages({
    "string.base": "Role should be a type of text",
    "string.empty": "Role cannot be empty",
    "any.only": "Role must be either User or Admin",
    "any.default": "Default role User will be assigned",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.base": "Phone number should be a type of text",
      "string.empty": "Phone number cannot be empty",
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),
  password: Joi.string()
    .empty("")
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must include uppercase, lowercase, number, and special character",
      "string.empty": "Password is required",
      "any.required": "Password is required",
      "string.base": "Password must be a string",
    }),
  fcm_token: Joi.string().allow("", null).optional().messages({
    "string.base": "fcm_token should be string",
  }),
  // device_id: Joi.string().allow('', null).optional().messages({
  //   'string.base': 'device_id should be string',
  // }),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email should be a type of text",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  username: Joi.string().allow("", null).optional().messages({
    "string.base": "User name should be string",
  }),
  password: Joi.string()
    .empty("")
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must include uppercase, lowercase, number, and special character",
      "string.empty": "Password is required",
      "any.required": "Password is required",
      "string.base": "Password must be a string",
    }),
  fcm_token: Joi.string().allow("", null).optional().messages({
    "string.base": "Fcm token should be string",
  }),
  authProviderId: Joi.string().allow("", null).optional().messages({
    "string.empty": "AuthProviderId cannot be empty",
    "string.base": "AuthProviderId should be string",
  }),
});

exports.verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email should be a type of text",
    "string.email": "Please enter a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(6).required().messages({
    "string.base": "OTP should be a type of text",
    "string.empty": "OTP cannot be empty",
    "string.length": "OTP must be 6 digits",
    "any.required": "OTP is required",
  }),
});

exports.resendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email should be a type of text",
    "string.email": "Please enter a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
});

exports.resetPasswordSchema = Joi.object({
 token: Joi.string().required().messages({
    "string.base": "Token should be a type of text",
    "string.empty": "Token cannot be empty",
    "any.required": "Token is required",
  }),
  newPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password should be a type of text",
      "string.empty": "Password cannot be empty",
      "string.pattern.base":
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email should be a type of text",
    "string.email": "Please enter a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
});

exports.oAuthLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().optional().allow(""),
  authProvider: Joi.string()
    .valid(...Object.values(AUTH_PROVIDER))
    .required(),
  authProviderId: Joi.string().required(),
  fcm_token: Joi.string().optional().allow(""),
});
