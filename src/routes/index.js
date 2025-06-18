const { Router } = require('express');
const authRoute = require('./authRoutes');
const storageRoutes = require('./storageRoutes');
const storageUnitRoutes = require('./storageUnitRoutes');
const pricingProfileRoutes = require('./pricingProfileRoutes');
const profileRoutes = require('./profileRoutes');
const bookingRoutes = require('./bookingRoutes'); 
const meetingRoutes = require('./meetingRoutes');
const oauthRoutes = require('./oauthRoutes');

const router = Router();

router.use('/auth', authRoute);
router.use('/storage-properties', storageRoutes);
router.use('/storage-units', storageUnitRoutes);
router.use('/pricing-profiles', pricingProfileRoutes);
router.use('/profile', profileRoutes);
router.use('/bookings', bookingRoutes);
router.use('/meetings', meetingRoutes);
router.use('/oauth', oauthRoutes);

module.exports = router;
