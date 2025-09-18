
const User = require('../../models/user');

module.exports = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return res.recordNotFound({ message: 'Admin Profile not found' });
    
    const response = await User.findByIdAndUpdate(user._id, { stripeCredentials: {} }, {new: true});
    
    return res.success({ message: 'Stripe tokens removed successfully', data: response });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};