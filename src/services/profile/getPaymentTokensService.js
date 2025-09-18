const { decrypt } = require('../../utils/encoder');
const User = require('../../models/user');

module.exports = async (adminUserId) => {
  const user = await User.findById(adminUserId);
  if (!user || !user.stripeCredentials) {
    throw new Error('Admin payment credentials not found');
  }
  return {
    secretKey: decrypt(user.stripeCredentials.secretKey),
    publicKey: decrypt(user.stripeCredentials.publicKey)
  };
};