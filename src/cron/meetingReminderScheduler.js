const cron = require('node-cron');
const sendMeetingReminders = require('../services/meeting/sendMeetingReminders');

const scheduleMeetingReminder = () => {
  cron.schedule('* * * * *', async () => {
    console.log('Running meeting reminder check...');
    try {
      const result = await sendMeetingReminders();
      console.log('Meeting reminder job completed:', result);
    } catch (error) {
      console.error('Meeting reminder job failed:', error);
    }
  });
};

module.exports = scheduleMeetingReminder;