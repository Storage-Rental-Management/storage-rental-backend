const Meeting = require('../../models/meeting');
const { updateMeetingSchema } = require('../../validation/meetingValidation');
const ActivityLog = require('../../models/activityLog');

module.exports = async (req, res) => {
    try {
        // Validate input
        const { error } = updateMeetingSchema.validate(req.body);
        if (error) {
            return res.validationError({ message: error.details[0].message });
        }

        // Find and update meeting
        const meeting = await Meeting.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('organizerId', 'username email')
         .populate('attendeeId', 'username email');

        if (!meeting) {
            return res.recordNotFound({ message: 'Meeting not found' });
        }

        if (meeting.bookingId) {
            await ActivityLog.create({
                bookingId: meeting.bookingId,
                userId: req.user.id,
                action: req.body.meetingStatus
            });
        }

        return res.success({
            data: meeting,
            message: 'Meeting updated successfully'
        });
    } catch (error) {
        console.error('Error updating meeting:', error);
        return res.internalServerError({
            message: 'Failed to update meeting',
            error: error.message
        });
    }
};
