const cron = require('node-cron');
const sendMonthlyPaymentReminders = require('../services/booking/monthlyPaymentReminderService');
const handleBookingExpiry = require('../services/booking/bookingExpiryHandlerService');

// Run every day at midnight
const scheduleDailyMaintenanceTasks = () => {
  cron.schedule('0 0 * * *', async () => {

    console.log('Running monthly payment reminder check...');
    try {
      await sendMonthlyPaymentReminders();
      console.log('Monthly payment reminder check completed.');
    } catch (error) {
      console.error('Monthly payment reminder check failed:', error);
    }

    console.log('Running booking expiry handler...');
    try {
      const bookingResult = await handleBookingExpiry();
      console.log('Booking expiry handler completed:', bookingResult);
    } catch (error) {
      console.error('Booking expiry handler failed:', error);
    }
  });
};

module.exports = scheduleDailyMaintenanceTasks;  