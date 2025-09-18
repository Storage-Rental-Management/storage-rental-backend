const createSubscriptionService = require('../services/subscription/createSubscription');
const getSubscriptionDetailsService = require('../services/subscription/getSubscriptionDetails');
const cancelSubscriptionService = require('../services/subscription/cancelSubscription');
const resumeSubscriptionService = require('../services/subscription/resumeSubscription');


const createSubscription = async (req, res) => {
  try {
    await createSubscriptionService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getSubscriptionDetails = async (req, res) => {
  try {
    await getSubscriptionDetailsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const cancelSubscription = async (req, res) => {
  try {
    await cancelSubscriptionService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const resumeSubscription = async (req, res) => {
  try {
    await resumeSubscriptionService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};


module.exports = {
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
  resumeSubscription
}; 