const healthCheckUseCase = require('../services/healthCheck');

const healthCheck = async (req, res) => {
    try {
        return healthCheckUseCase(req, res);
    } catch (error) {
        console.log(error);
        res.failure({
            error: error.message,
        });
    }
};

module.exports = {
    healthCheck,
};
