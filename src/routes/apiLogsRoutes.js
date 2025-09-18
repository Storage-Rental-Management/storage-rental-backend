const router = require('express').Router();

const { getApiLogs } = require('../controllers/apiLogsController');

router.get('/get', getApiLogs);

module.exports = router;
