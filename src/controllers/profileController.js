const getAllProfilesService = require('../services/profile/getAllProfilesService');
const getProfileByIdService = require('../services/profile/getProfileByIdService');
const updateProfileService = require('../services/profile/updateProfileService');
const deleteProfileService = require('../services/profile/deleteProfileService');
const updateFcmTokenService = require('../services/profile/updateFcmTokenService');
const updatePaymentTokensService = require('../services/profile/updatePaymentTokensService');
const updatePaymentInstructionsService = require('../services/profile/updatePaymentInstructionsService');
const unlinkPaymentTokensService = require('../services/profile/unlinkPaymentTokensService');

// Get all profiles
const getAllProfiles = async (req, res) => {
    try {
        await getAllProfilesService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get profile by ID
const getProfileById = async (req, res) => {
    try {
        await getProfileByIdService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    try {
        await updateProfileService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Delete profile
const deleteProfile = async (req, res) => {
    try {
        await deleteProfileService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// In src/controllers/profileController.js
const updateFcmToken = async (req, res) => {
    try {
      await updateFcmTokenService(req, res);
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
};

const updatePaymentTokens = async (req, res) => {
    try {
      await updatePaymentTokensService(req, res);
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
};

const updatePaymentInstructions = async (req, res) => {
    try {
      await updatePaymentInstructionsService(req, res);
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
};

const unlinkPaymentTokens = async (req, res) => {
    try {
      await unlinkPaymentTokensService(req, res);
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
};

module.exports = {
    getAllProfiles,
    getProfileById,
    updateProfile,
    deleteProfile, 
    updateFcmToken,
    updatePaymentTokens,
    updatePaymentInstructions,
    unlinkPaymentTokens
}; 