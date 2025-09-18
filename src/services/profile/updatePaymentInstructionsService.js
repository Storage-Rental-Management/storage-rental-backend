
// src/services/profile/updateFcmTokenService.js
const User = require('../../models/user');

module.exports = async (req, res) => {
  try {

    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return res.recordNotFound({ message: 'Admin Profile not found' });

    const { cheque, eTransfer, cash } = req.body;

    const response = await User.findByIdAndUpdate(user._id, { 
      paymentInstructions: {
        cheque,
        eTransfer,
        cash
      } 
  }, {new: true});
    
    return res.success({ message: 'Stripe tokens updated successfully', data: response });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};