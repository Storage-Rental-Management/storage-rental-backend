const router = require('express').Router();

const { healthCheck } = require('../controllers/healthCheckController');

router.get('/health-check', healthCheck);

module.exports = router;
