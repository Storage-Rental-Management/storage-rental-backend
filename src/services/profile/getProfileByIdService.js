const User = require('../../models/user');

module.exports = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select('-password');
        if (!user) return res.recordNotFound({ message: 'Profile not found' });
        return res.success({ data: user });
    } catch (error) {
        return res.internalServerError({ message: 'Failed to fetch User profile', data: { errors: error.message } });
    }
}; 