const Advertisement = require('../../models/advertisement');
const { AD_STATUS } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const currentDate = new Date();

    // Fetch all active ads
    const allActiveAds = await Advertisement.find({
      status: AD_STATUS.AD_APPROVED
    }).populate('requesterId', 'username email');

    // Filter with validation
    const validAds = [];
    const invalidAds = [];  

    allActiveAds.forEach(ad => {
      const startDate = new Date(ad.startDate);
      const endDate = new Date(ad.endDate);
      const currentDateOnly = new Date(currentDate.toDateString());
      const startDateOnly = new Date(startDate.toDateString());
      const endDateOnly = new Date(endDate.toDateString());

      
      // Check for backwards dates
      if (startDateOnly > endDateOnly) {
        console.error(`⚠️ Ad ${ad._id} has backwards dates: start=${startDate.toISOString()}, end=${endDate.toISOString()}`);
        invalidAds.push(ad._id);
        return;
      }
      
      // Check if currently active
      const isActive = startDateOnly <= currentDateOnly && endDateOnly >= currentDateOnly;
      
      if (isActive) {
        validAds.push(ad);
      }
    });

    if (invalidAds.length > 0) {
      console.warn(`Found ${invalidAds.length} ads with invalid dates. Please fix them.`);
    }

    validAds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.success({
      message: 'Active advertisements retrieved successfully',
      data: validAds,
      meta: {
        totalActive: validAds.length,
        totalInvalid: invalidAds.length,
        queryDate: currentDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Get Active Ads Error:', error);
    return res.internalServerError({ message: error.message });
  }
};