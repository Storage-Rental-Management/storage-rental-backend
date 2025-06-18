const express = require('express');
const router = express.Router();
const OAuthController = require('../controllers/oauthController');

// Google OAuth routes
router.get('/google', OAuthController.googleAuth);
router.get('/google/callback', OAuthController.googleCallback);

// Facebook OAuth routes
router.get('/facebook', OAuthController.facebookAuth);
router.get('/facebook/callback', OAuthController.facebookCallback);

// Apple OAuth routes
router.get('/apple', OAuthController.appleAuth);
router.get('/apple/callback', OAuthController.appleCallback);

module.exports = router; 