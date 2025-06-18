const passport = require('passport');
const OAuthService = require('../services/auth/oauthService');

class OAuthController {
    static googleAuth(req, res, next) {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    }

    static googleCallback(req, res, next) {
        passport.authenticate('google', async (err, profile) => {
            try {
                if (err) {
                    return res.unAuthorized({ message: 'Google authentication failed' });
                }

                const result = await OAuthService.handleGoogleAuth(profile);
                
                // Redirect to frontend with token
                res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${result.token}`);
            } catch (error) {
                console.error('Google callback error:', error);
                res.redirect(`${process.env.FRONTEND_URL}/oauth/error`);
            }
        })(req, res, next);
    }

    static facebookAuth(req, res, next) {
        passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
    }

    static facebookCallback(req, res, next) {
        passport.authenticate('facebook', async (err, profile) => {
            try {
                if (err) {
                    return res.unAuthorized({ message: 'Facebook authentication failed' });
                }

                const result = await OAuthService.handleFacebookAuth(profile);
                
                // Redirect to frontend with token
                res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${result.token}`);
            } catch (error) {
                console.error('Facebook callback error:', error);
                res.redirect(`${process.env.FRONTEND_URL}/oauth/error`);
            }
        })(req, res, next);
    }

    static appleAuth(req, res, next) {
        passport.authenticate('apple', { scope: ['name', 'email'] })(req, res, next);
    }

    static appleCallback(req, res, next) {
        passport.authenticate('apple', async (err, profile) => {
            try {
                if (err) {
                    return res.unAuthorized({ message: 'Apple authentication failed' });
                }

                const result = await OAuthService.handleAppleAuth(profile);
                
                // Redirect to frontend with token
                res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${result.token}`);
            } catch (error) {
                console.error('Apple callback error:', error);
                res.redirect(`${process.env.FRONTEND_URL}/oauth/error`);
            }
        })(req, res, next);
    }
}

module.exports = OAuthController; 