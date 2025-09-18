const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionController');

router.post('/create', isAuthenticated, subscriptionController.createSubscription);
router.get('/details', isAuthenticated, subscriptionController.getSubscriptionDetails);
router.post('/cancel', isAuthenticated, subscriptionController.cancelSubscription);
router.post('/resume', isAuthenticated, subscriptionController.resumeSubscription);
// router.post('/webhook', subscriptionController.handleWebhook);

module.exports = router;