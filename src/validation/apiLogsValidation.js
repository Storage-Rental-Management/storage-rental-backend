const Joi = require('joi');

const getLogsValidation = Joi.object({
    page: Joi.number().integer().min(10).optional(),
    limit: Joi.number().integer().min(10).optional(),
});

module.exports = { getLogsValidation };
