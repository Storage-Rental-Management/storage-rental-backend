const User = require('../../models/user');
const Role = require('../../models/role'); // ✅ Import Role model
const { generateToken } = require('../../resources/utils');

const USER_ROLE_ID = '6847d7981ecb63888314bd55';

class OAuthService {
    static async handleGoogleAuth(profile) {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                // ✅ Get "User" role
                // const userRole = await Role.findOne({ name: 'User' });
                // if (!userRole) throw new Error('Default role "User" not found');

                user = await User.create({
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    profileImage: profile.photos[0].value,
                    isVerified: true,
                    authProvider: 'google',
                    authProviderId: profile.id,
                    role: USER_ROLE_ID // ✅ Assign role
                });
            } else if (user.authProvider !== 'google') {
                user.authProvider = 'google';
                user.authProviderId = profile.id;
                user.profileImage = profile.photos[0].value;
                await user.save();
            }

            const token = generateToken(user);
            return { user, token };
        } catch (error) {
            throw new Error(`Google authentication failed: ${error.message}`);
        }
    }

    static async handleFacebookAuth(profile) {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                // ✅ Get "User" role
                // const userRole = await Role.findOne({ name: 'User' });
                // if (!userRole) throw new Error('Default role "User" not found');

                user = await User.create({
                    email: profile.emails[0].value,
                    username: `${profile.name.givenName} ${profile.name.familyName}`,
                    profileImage: profile.photos ? profile.photos[0].value : null,
                    isVerified: true,
                    authProvider: 'facebook',
                    authProviderId: profile.id,
                    role: USER_ROLE_ID // ✅ Assign role
                });
            } else if (user.authProvider !== 'facebook') {
                user.authProvider = 'facebook';
                user.authProviderId = profile.id;
                if (profile.photos) {
                    user.profileImage = profile.photos[0].value;
                }
                await user.save();
            }

            const token = generateToken(user);
            return { user, token };
        } catch (error) {
            throw new Error(`Facebook authentication failed: ${error.message}`);
        }
    }

    static async handleAppleAuth(profile) {
        try {
            let user = await User.findOne({ email: profile.email });

            if (!user) {
                user = await User.create({
                    email: profile.email,
                    username: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : profile.email.split('@')[0],
                    profileImage: null, // Apple doesn't provide profile image
                    isVerified: true,
                    authProvider: 'apple',
                    authProviderId: profile.id,
                    role: USER_ROLE_ID
                });
            } else if (user.authProvider !== 'apple') {
                user.authProvider = 'apple';
                user.authProviderId = profile.id;
                await user.save();
            }

            const token = generateToken(user);
            return { user, token };
        } catch (error) {
            throw new Error(`Apple authentication failed: ${error.message}`);
        }
    }
}

module.exports = OAuthService;
