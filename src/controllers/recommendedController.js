const createRecommendedService = require("../services/recommendedProperty/createRecommended");
const getAllRecommendedService = require("../services/recommendedProperty/getAllRecommended");
const getRecommendedByIdService = require("../services/recommendedProperty/getRecommendedById");
const updateRecommendedService = require("../services/recommendedProperty/updateRecommended");
const deleteRecommendedService = require("../services/recommendedProperty/deleteRecommended");
const reviewRecommendedService = require("../services/recommendedProperty/reviewRecommended");

// Create Recommended
const createRecommended = async (req, res) => {
  try {
    await createRecommendedService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get all Recommended with search and pagination
const getAllRecommended = async (req, res) => {
  try {
    await getAllRecommendedService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get Recommended by ID
const getRecommendedById = async (req, res) => {
  try {
    await getRecommendedByIdService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Update Recommended
const updateRecommended = async (req, res) => {
  try {
    await updateRecommendedService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Delete Recommended
const deleteRecommended = async (req, res) => {
  try {
    await deleteRecommendedService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Review Recommended
const reviewRecommended = async (req, res) => {
  try {
    await reviewRecommendedService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  createRecommended,
  getAllRecommended,
  getRecommendedById,
  updateRecommended,
  deleteRecommended,
  reviewRecommended,
};
