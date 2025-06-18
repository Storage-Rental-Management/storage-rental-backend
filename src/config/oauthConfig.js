const dotenv = require('dotenv');
dotenv.config();

const GOOGLE_CONFIG = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/oauth/google/callback',
    scope: ['profile', 'email']
};

const FACEBOOK_CONFIG = {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/oauth/facebook/callback',
    profileFields: ['id', 'emails', 'name']
};

const APPLE_CONFIG = {
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
    callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3000/api/oauth/apple/callback',
    scope: ['name', 'email']
};

module.exports = {
    GOOGLE_CONFIG,
    FACEBOOK_CONFIG,
    APPLE_CONFIG
}; 