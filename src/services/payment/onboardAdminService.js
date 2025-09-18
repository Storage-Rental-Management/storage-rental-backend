const stripe = require('../../config/stripe').stripe;
const User = require('../../models/user');

module.exports = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await User.findById(adminId);
    if (!admin) return res.recordNotFound({ error: 'Admin not found' });

    // Create Stripe account if not exists
    if (!admin.stripeAccountId) {
      const account = await stripe.accounts.create(
        {
          type: 'express',
          email: admin.email,
        },   
      );
      admin.stripeAccountId = account.id;
      await admin.save();
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: admin.stripeAccountId,
      refresh_url: process.env.STRIPE_REFRESH_URL,
      return_url: process.env.STRIPE_RETURN_URL,
      type: 'account_onboarding',
    });

    return res.success({
      message: "Onboarding link generated successfully",
      data: {
        url: accountLink.url,
        stripeAccountId: admin.stripeAccountId
      }
    });

  } catch (err) {
    return res.internalServerError({
      message: err.message || "Failed to onboard admin",
    });
  }
};
