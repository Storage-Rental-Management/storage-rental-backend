const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const {
  createRecommended,
  getAllRecommended,
  getRecommendedById,
  updateRecommended,
  updateRecommendedStatus,
  deleteRecommended,
  reviewRecommended,
} = require("../controllers/recommendedController");

// Create Recommended
router.post("/", isAuthenticated, createRecommended);

// Get all Recommended with search and pagination (admin only)
router.get("/", isAuthenticated, getAllRecommended);

// Get Recommended by ID
router.get("/:recommendedId", isAuthenticated, getRecommendedById);

// Update Recommended
router.put("/:recommendedId", isAuthenticated, updateRecommended);

// Delete Recommended
router.delete("/:recommendedId", isAuthenticated, deleteRecommended);

// Review Recommended
router.post("/:recommendedId/review", isAuthenticated, reviewRecommended);

module.exports = router;
