const getApiLogsUseCase = require('../services/apiLogs/getApiLogs');

const getApiLogs = async (req, res) => {
    try {
        return await getApiLogsUseCase(req, res);
    } catch (error) {
        logError(error);
        return res.internalServerError({
            error: error.message,
        });
    }
};

module.exports = {
    getApiLogs,
};
