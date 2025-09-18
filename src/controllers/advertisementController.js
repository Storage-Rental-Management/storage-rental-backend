const createAdvertisementService = require('../services/advertisement/createAdvertisement');
const getAllAdvertisementsService = require('../services/advertisement/getAllAdvertisements');
const getActiveAdvertisementsService = require('../services/advertisement/getActiveAdvertisements');
const updateAdvertisementStatusService = require('../services/advertisement/updateAdvertisementStatus');
const updateAdvertisementService = require('../services/advertisement/updateAdvertisement');
const getAdvertisementByIdService = require('../services/advertisement/getAdvertisementById');
const deleteAdvertisementService = require('../services/advertisement/deleteAdvertisement');
const submitAdvertisementService = require('../services/advertisement/submitAdvertisement');
const reviewAdvertisementService = require('../services/advertisement/reviewAdvertisement');

// Create advertisement
const createAdvertisement = async (req, res) => {
    try {
        await createAdvertisementService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get all advertisements with search and pagination
const getAllAdvertisements = async (req, res) => {
    try {
        await getAllAdvertisementsService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get active advertisements
const getActiveAdvertisements = async (req, res) => {
    try {
        await getActiveAdvertisementsService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get advertisement by ID
const getAdvertisementById = async (req, res) => {
    try {
        await getAdvertisementByIdService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Update advertisement
const updateAdvertisement = async (req, res) => {
    try {
        await updateAdvertisementService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Update advertisement status
const updateAdvertisementStatus = async (req, res) => {
    try {
        await updateAdvertisementStatusService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Delete advertisement
const deleteAdvertisement = async (req, res) => {
    try {
        await deleteAdvertisementService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Submit advertisement for review
const submitAdvertisement = async (req, res) => {
    try {
        await submitAdvertisementService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Review advertisement
const reviewAdvertisement = async (req, res) => {
    try {
        await reviewAdvertisementService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

module.exports = {
    createAdvertisement,
    getAllAdvertisements,
    getActiveAdvertisements,
    getAdvertisementById,
    updateAdvertisement,
    updateAdvertisementStatus,
    deleteAdvertisement,
    submitAdvertisement,
    reviewAdvertisement,
}; 