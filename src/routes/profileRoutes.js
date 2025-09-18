const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middlewares/auth');
const getUploader = require('../middlewares/upload');

const {
    getAllProfiles,
    getProfileById,
    updateProfile,
    deleteProfile,
    updateFcmToken,
    updatePaymentTokens,
    updatePaymentInstructions,
    unlinkPaymentTokens,
} = require('../controllers/profileController');
const { ROLES } = require("../constants/databaseEnums");

const upload = getUploader('profiles');

router.get('/get-all-profiles', isAuthenticated, getAllProfiles);
router.get('/get-profile/:id', isAuthenticated, getProfileById);
router.put('/update-profile/:id', isAuthenticated, upload.single('profileImage'), updateProfile);
router.delete('/delete-profile/:id', isAuthenticated, deleteProfile);
router.put('/fcm-token', isAuthenticated, updateFcmToken);
router.put('/admin/payment-credentials/:id', isAuthenticated, hasRole(ROLES.ADMIN), updatePaymentTokens);
router.put('/admin/payment-instructions/:id', isAuthenticated, hasRole(ROLES.ADMIN), updatePaymentInstructions);
router.put('/admin/unlink-payment-credentials/:id', isAuthenticated, hasRole(ROLES.ADMIN), unlinkPaymentTokens);

module.exports = router;
