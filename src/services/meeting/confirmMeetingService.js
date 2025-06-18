const Meeting = require('../../models/meeting');
const User = require('../../models/user');
const Booking = require('../../models/booking');
const ActivityLog = require('../../models/activityLog');
const { sendMeetingConfirmationEmail, sendMeetingDeclinedEmail } = require('../../resources/emailUtils');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.unAuthorized({ message: 'Only admin can confirm or decline meetings.' });
        }

        const { meetingStatus } = req.body; 
        if (!['meeting-confirmed', 'meeting-rejected'].includes(meetingStatus)) {
            return res.validationError({ message: 'Status must be meeting-confirmed or meeting-rejected.' });
        }

        const meeting = await Meeting.findByIdAndUpdate(
            req.params.id,
            { meetingStatus },
            { new: true }
        )
        .populate('attendeeId', 'email username')
        .populate('organizerId', 'email username');  

        if (!meeting) return res.recordNotFound({ message: 'Meeting not found' });

        // --- Sync booking status ---
        const statusMap = {
            'meeting-confirmed': BOOKING_STATUS.MEETING_CONFIRMED,
            'meeting-rejected': BOOKING_STATUS.MEETING_REJECTED
        };
        const newBookingStatus = statusMap[meetingStatus];
        if (meeting.bookingId && newBookingStatus) {
            await Booking.findByIdAndUpdate(meeting.bookingId, { bookingStatus: newBookingStatus });
        }

        // Log activity
        if (meeting.bookingId) {
            await ActivityLog.create({
                bookingId: meeting.bookingId,
                userId: req.user.id,
                action: meetingStatus
            });
        }

        const attendee = await User.findById(meeting.attendeeId);
        const organizer = await User.findById(meeting.organizerId);

        // Notify attendee
        if (meetingStatus === 'meeting-confirmed') {
            if (organizer?.email) {
                await sendMeetingConfirmationEmail(organizer.email, meeting);
            }
        } else {
            if (attendee?.email) {
                await sendMeetingDeclinedEmail(attendee.email, meeting, attendee.username);
            }
            if (organizer?.email) {
                await sendMeetingDeclinedEmail(organizer.email, meeting, organizer.username);
            }
        }

        return res.success({
            data: meeting,
            message: `Meeting ${meetingStatus} and attendee notified.`
        });

    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};
