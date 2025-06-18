const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { GOOGLE_CONFIG, FACEBOOK_CONFIG } = require('./oauthConfig');

// Google Strategy
passport.use(new GoogleStrategy(
    GOOGLE_CONFIG,
    async (accessToken, refreshToken, profile, done) => {
        try {
            return done(null, profile);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Facebook Strategy
passport.use(new FacebookStrategy(
    FACEBOOK_CONFIG,
    async (accessToken, refreshToken, profile, done) => {
        try {
            return done(null, profile);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport; 