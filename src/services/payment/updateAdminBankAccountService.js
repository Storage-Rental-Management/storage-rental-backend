const stripe = require('../../config/stripe').stripe;
const User = require('../../models/user');

module.exports = async (req, res) => {
  try {
    const adminId = req.user.id; // or req.body.adminId if you want to allow adminId in body
    const admin = await User.findById(adminId);
    if (!admin || !admin.stripeAccountId) {
      return res.recordNotFound({ error: 'Admin or Stripe account not found' });
    }
    const account = await stripe.accounts.retrieve(admin.stripeAccountId);
    if (account.external_accounts && account.external_accounts.data.length > 0) {
      admin.bankAccountId = account.external_accounts.data[0].id;
      await admin.save();
      return res.success({ message: 'Bank account updated', bankAccountId: admin.bankAccountId });
    } else {
      return res.success({ message: 'No bank account found for this admin.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
