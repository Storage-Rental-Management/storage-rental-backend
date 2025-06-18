const getAllProfilesService = require('../services/profile/getAllProfilesService');
const getProfileByIdService = require('../services/profile/getProfileByIdService');
const updateProfileService = require('../services/profile/updateProfileService');
const deleteProfileService = require('../services/profile/deleteProfileService');

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

module.exports = {
    getAllProfiles,
    getProfileById,
    updateProfile,
    deleteProfile
}; 