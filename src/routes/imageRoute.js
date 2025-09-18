const express = require("express");
const router = express.Router();
const { removeImage } = require("../controllers/imageController");
const { isAuthenticated } = require("../middlewares/auth");

router.delete("/:module/:id", isAuthenticated, removeImage);

module.exports = router;