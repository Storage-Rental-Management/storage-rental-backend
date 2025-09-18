const Meeting = require('../../models/meeting');

module.exports = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('organizerId', 'username email')
            .populate('attendeeId', 'username email');

        if (!meeting) {
            return res.recordNotFound({ message: 'Meeting not found' });
        }

        return res.success({
            data: meeting,
            message: 'Meeting retrieved successfully'
        });
    } catch (error) {
        return res.internalServerError({
            message: 'Failed to fetch meeting',
            error: error.message
        });
    }
}; 