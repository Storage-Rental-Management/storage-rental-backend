const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');
const { isAuthenticated } = require('../middlewares/auth');
const getUploader = require('../middlewares/upload');

const upload = getUploader('advertisements'); // Use 'advertisements' folder for ad images

// Create advertisement (requires authentication)
router.post(
  '/',
  isAuthenticated,
  upload.array('adImages', 5),
  advertisementController.createAdvertisement
);

// Get all advertisements with search and pagination (admin only)
router.get(
  '/',
  isAuthenticated,
  advertisementController.getAllAdvertisements
);

// Get active advertisements (public)
router.get(
  '/active',
  advertisementController.getActiveAdvertisements
);

// Get advertisement by ID
router.get(
  '/:advertisementId',
  isAuthenticated,
  advertisementController.getAdvertisementById
);

// Update advertisement
router.put(
  '/:advertisementId',
  isAuthenticated,
  upload.array('adImages', 5),
  advertisementController.updateAdvertisement
);

// Update advertisement status (admin only)
router.put(
  '/:advertisementId/status',
  isAuthenticated,
  advertisementController.updateAdvertisementStatus
);

// Delete advertisement
router.delete(
  '/:advertisementId',
  isAuthenticated,
  advertisementController.deleteAdvertisement
);

// Submit advertisement for review (requires authentication)
router.post(
  '/:id/submit',
  isAuthenticated,
  advertisementController.submitAdvertisement
);

// Review advertisement (admin only)
router.post(
  '/:id/review',
  isAuthenticated,
  advertisementController.reviewAdvertisement
);


module.exports = router; 