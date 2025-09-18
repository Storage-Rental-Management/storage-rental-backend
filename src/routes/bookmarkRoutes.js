const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const bookmarkController = require('../controllers/bookmarkController');


// Bookmark/Un-bookmark Property
router.post('/property/:propertyId', isAuthenticated, bookmarkController.bookmarkProperty);
router.delete('/property/:propertyId', isAuthenticated, bookmarkController.unBookmarkProperty);

// Bookmark/Un-bookmark Unit
router.post('/unit/:unitId', isAuthenticated, bookmarkController.bookmarkUnit);
router.delete('/unit/:unitId', isAuthenticated, bookmarkController.unBookmarkUnit);

// Get Bookmarked Properties/Units
router.get('/properties', isAuthenticated, bookmarkController.getBookmarkedProperties);
router.get('/units', isAuthenticated, bookmarkController.getBookmarkedUnits);

module.exports = router;