const Meeting = require('../../models/meeting');

module.exports = async (req, res) => {
    try {
        const meeting = await Meeting.findByIdAndUpdate(
            req.params.id,
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (!meeting) {
            return res.recordNotFound({ message: 'Meeting not found' });
        }

        return res.success({
            message: 'Meeting deleted successfully'
        });
    } catch (error) {
        return res.internalServerError({
            message: 'Failed to delete meeting',
            error: error.message
        });
    }
}; 