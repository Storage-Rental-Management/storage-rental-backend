
// src/services/profile/updateFcmTokenService.js
const User = require('../../models/user');
const { encrypt, decrypt } = require('../../utils/encoder');

module.exports = async (req, res) => {
  try {

    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return res.recordNotFound({ message: 'Admin Profile not found' });

    const { secretKey, publicKey } = req.body;
    if (!secretKey || !publicKey) {
      return res.validationError({ message: 'Secret Key and Public Key are required!' });
    }

    const encryptedPublicKey = encrypt(publicKey);
    const encryptedSecretKey = encrypt(secretKey);

    const response = await User.findByIdAndUpdate(user._id, { 
      stripeCredentials: {
        publicKey: encryptedPublicKey,
        secretKey: encryptedSecretKey,
      } 
  }, {new: true});
    
    return res.success({ message: 'Stripe tokens updated successfully', data: response });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};