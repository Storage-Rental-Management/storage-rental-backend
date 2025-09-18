const { sendNotification } = require('../../resources/notification');

module.exports = async (req, res) => {
  try {
    await sendNotification(req.body, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 