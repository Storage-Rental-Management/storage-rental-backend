const Meeting = require('../../models/meeting');
const User = require('../../models/user');
const Booking = require('../../models/booking');
const { sendMeetingCompletedEmail } = require('../../resources/emailUtils');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');
const { sendNotification } = require('../../resources/notification');
const StorageUnit = require('../../models/storageUnit');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
    try {
        const { meetingStatus } = req.body; 

        if (!['meeting-completed'].includes(meetingStatus)) {
            return res.validationError({ message: 'Status must be meeting-completed.' });
        }

        const meeting = await Meeting.findByIdAndUpdate(
            req.params.id,
            { meetingStatus },
            { new: true }
        ).populate('organizerId', 'email username')
         .populate('attendeeId', 'email username');

        if (!meeting) return res.recordNotFound({ message: 'Meeting not found' });

        // --- Sync booking status ---
        const statusMap = {
            'meeting-completed': BOOKING_STATUS.MEETING_COMPLETED,
        };

        const newBookingStatus = statusMap[meetingStatus];
        if (meeting.bookingId && newBookingStatus) {
            await Booking.findByIdAndUpdate(meeting.bookingId, { bookingStatus: newBookingStatus });
        }
        // --- End sync ---

        if (meeting.attendeeId && meeting.scheduledFor) {
            await User.findByIdAndUpdate(meeting.attendeeId, {
              $pull: { bookedSlots: new Date(meeting.scheduledFor) }
            });
          }

        // Notify both parties
        let unitName = '';
        try {
          const unit = await StorageUnit.findById(meeting.unitId);
          if (unit && unit.name) unitName = unit.name;
        } catch (e) {}
        const meetingTime = meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : '';
        // Organizer notification
        if (meeting.organizerId && meeting.organizerId.email) {
            await sendMeetingCompletedEmail(meeting.organizerId.email, meeting, meetingStatus);
            await sendNotification({
                recipientId: meeting.organizerId._id || meeting.organizerId,
                title: 'Meeting Completed!',
                message: `Hi ${meeting.organizerId.username || 'User'}, your meeting${unitName ? ' for unit "' + unitName + '"' : ''}${meetingTime ? ' on ' + meetingTime : ''} has been marked as completed. Thank you for your participation! We hope it was productive.`,
                group: 'Meeting',
                type: NOTIFICATION_TYPE.MEETING_COMPLETED,
                priority: NOTIFICATION_PRIORITY.MEDIUM,
                metadata: { meetingId: meeting._id, unitId: meeting.unitId },
                isAction: false
              });
        }
        // Attendee notification
        if (meeting.attendeeId && meeting.attendeeId.email) {
            await sendMeetingCompletedEmail(meeting.attendeeId.email, meeting, meetingStatus);
            await sendNotification({
                recipientId: meeting.attendeeId._id || meeting.attendeeId,
                title: 'Meeting Completed!',
                message: `Hi ${meeting.attendeeId.username || 'User'}, your meeting${unitName ? ' for unit "' + unitName + '"' : ''}${meetingTime ? ' on ' + meetingTime : ''} has been marked as completed. Thank you for your participation! We hope it was productive.`,
                group: 'Meeting',
                type: NOTIFICATION_TYPE.MEETING_COMPLETED,
                priority: NOTIFICATION_PRIORITY.MEDIUM,
                metadata: { meetingId: meeting._id, unitId: meeting.unitId },
                isAction: false
              });
        }

        return res.success({
            data: meeting,
            message: 'Meeting status updated and both parties notified.'
        });

    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};
