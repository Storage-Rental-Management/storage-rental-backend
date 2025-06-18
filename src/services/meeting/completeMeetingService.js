const Meeting = require('../../models/meeting');
const User = require('../../models/user');
const Booking = require('../../models/booking');
const ActivityLog = require('../../models/activityLog');
const { sendMeetingCompletedEmail } = require('../../resources/emailUtils');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');

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

        // Log activity
        if (meeting.bookingId) {
            await ActivityLog.create({
                bookingId: meeting.bookingId,
                userId: req.user.id,
                action: meetingStatus
            });
        }

        // Notify both parties
        if (meeting.organizerId && meeting.organizerId.email) {
            await sendMeetingCompletedEmail(meeting.organizerId.email, meeting, meetingStatus);
        }
        if (meeting.attendeeId && meeting.attendeeId.email) {
            await sendMeetingCompletedEmail(meeting.attendeeId.email, meeting, meetingStatus);
        }

        return res.success({
            data: meeting,
            message: 'Meeting status updated and both parties notified.'
        });

    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};
