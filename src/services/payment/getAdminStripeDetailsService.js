const stripe = require("../../config/stripe").stripe;
const User = require("../../models/user");

module.exports = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.recordNotFound({
        message: "Admin not found",
      });
    }
    if (!admin.stripeAccountId) {
      return res.recordNotFound({
        message: "Stripe account not found",
      });
    }
    const account = await stripe.accounts.retrieve(admin.stripeAccountId);
    res.success({
      message: "Get Admin's stripe details successfully",
      data: account,
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
