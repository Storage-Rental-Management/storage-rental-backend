const Meeting = require('../../models/meeting');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');
// const { sendMeetingReminderEmail } = require('../../resources/emailUtils'); // Optional

const sendMeetingReminders = async () => {
  const now = new Date();
  const thirtyMinsLater = new Date(now.getTime() + 30 * 60000);

  const meetings = await Meeting.find({
    isReminderSent: false,
    scheduledFor: {
      $gte: now,
      $lte: thirtyMinsLater
    }
  }).populate('organizerId', 'email username')
    .populate('attendeeId', 'email username');


  for (const meeting of meetings) {
    const usersToNotify = [];

    if (meeting.organizerId) usersToNotify.push(meeting.organizerId);
    if (meeting.attendeeId) usersToNotify.push(meeting.attendeeId);

    for (const user of usersToNotify) {
      // Optional email
      // if (user.email) {
      //   await sendMeetingReminderEmail(user.email, {
      //     title: meeting.title,
      //     meetingTime: meeting.meetingTime
      //   });
      // }
      // In-app notification
      await sendNotification({
        recipientId: user._id,
        title: 'Meeting Reminder',
        message: `Hi ${user.username || 'User'}, just a friendly reminder: you have a meeting${meeting.title ? ' titled "' + meeting.title + '"' : ''}${meeting.scheduledFor ? ' scheduled for ' + new Date(meeting.scheduledFor).toLocaleString() : ''} in 30 minutes. Please be prepared and join on time for a smooth experience!`,
        group: 'Meeting',
        type: NOTIFICATION_TYPE.MEETING_REMINDER,
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: { meetingId: meeting._id },
        isAction: false
      });
    }

    // Mark as reminder sent
    meeting.isReminderSent = true;
    await meeting.save();

    console.log(`Meeting reminder sent for: ${meeting._id}`);
  }

  return {
    success: true,
    reminderCount: meetings.length
  };
};

module.exports = sendMeetingReminders;
