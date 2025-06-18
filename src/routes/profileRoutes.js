const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    getAllProfiles,
    getProfileById,
    updateProfile,
    deleteProfile
} = require('../controllers/profileController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.get('/get-all-profiles', isAuthenticated, getAllProfiles);
router.get('/get-profile/:id', isAuthenticated, getProfileById);
router.put('/update-profile/:id', isAuthenticated, upload.single('profileImage'), updateProfile);
router.delete('/delete-profile/:id', isAuthenticated, deleteProfile);

module.exports = router; 