const { logError } = require('../../resources/utils');
const { getLogsValidation } = require('../../validation/apiLogsValidation');
const fs = require('fs');
const path = require('path');

/**
 * @description Get API Logs from api log file
 * @param {page} - page number
 * @param {limit} - number of logs per page
 * @returns {object} - object with logs, total number of logs, page number and limit
 * @throws {Error} - Throws an error if the logs cannot be retrieved
 */
module.exports = async (req, res) => {
    try {
        const { error, value } = getLogsValidation.validate(req.query);
        if (error) {
            logError(error);
            return res.validationError({
                error: error.details[0].message,
            });
        }
        const { page = 1, limit = 10 } = value;
        const logPath = path.join(__dirname, '../../../logs/api.log');
        if (!fs.existsSync(logPath)) return res.json({ logs: [], total: 0 });

        const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
        const reversed = lines.reverse();
        const total = reversed.length;
        const start = (page - 1) * limit;
        const paginated = reversed.slice(start, start + limit).map((line) => JSON.parse(line));

        return res.success({
            data: {
                logs: paginated,
                total,
                page,
                limit,
            },
        });
    } catch (error) {
        logError(error);
        return res.internalServerError({
            error: error.message,
        });
    }
};
