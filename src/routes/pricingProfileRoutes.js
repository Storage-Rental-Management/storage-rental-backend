const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const pricingProfileController = require('../controllers/pricingProfileController');

router.post('/', isAuthenticated, pricingProfileController.create);
router.get('/', isAuthenticated, pricingProfileController.getAll);
router.get('/:id', isAuthenticated, pricingProfileController.getById);
router.put('/:id', isAuthenticated, pricingProfileController.update);
router.delete('/:id', isAuthenticated, pricingProfileController.remove);

module.exports = router; 