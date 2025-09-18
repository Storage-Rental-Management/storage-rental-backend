const Joi = require("joi");
const {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
} = require("../constants/notificationEnums");

const notificationValidationSchema = Joi.object({
  recipientId: Joi.string().required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  group: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(NOTIFICATION_TYPE))
    .required(),
  status: Joi.string()
    .valid(...Object.values(NOTIFICATION_STATUS))
    .default(NOTIFICATION_STATUS.UNREAD),
  priority: Joi.string()
    .valid(...Object.values(NOTIFICATION_PRIORITY))
    .default(NOTIFICATION_PRIORITY.MEDIUM),
  metadata: Joi.object().optional(),
  isAction: Joi.boolean().default(false),
  isActionCompleted: Joi.boolean().default(false),
  createdAt: Joi.date().optional(),
  readAt: Joi.date().allow(null).optional(),
});

const broadcastNotificationValidationSchema = Joi.object({
  title: Joi.string().required(),
  message: Joi.string().required(),
  group: Joi.string().optional(),
  type: Joi.string()
    .valid(...Object.values(NOTIFICATION_TYPE))
    .optional(),
  priority: Joi.string()
    .valid(...Object.values(NOTIFICATION_PRIORITY))
    .default(NOTIFICATION_PRIORITY.MEDIUM).optional(),
  notificationImages: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional(),
  isAction: Joi.boolean().optional(),
  
});

module.exports = {
  broadcastNotificationValidationSchema,
  notificationValidationSchema,
};
