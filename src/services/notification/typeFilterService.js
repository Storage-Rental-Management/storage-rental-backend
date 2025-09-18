const Notification = require('../../models/notification');

module.exports = async (req, res) => {
  try {
    const userId = req.user._id;
    const type = req.query.type || req.body.type;
    if (!type) {
      return res.validationError({ message: 'Notification type is required' });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: userId, type })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Notification.countDocuments({ recipientId: userId, type });

    return res.success({
      message: 'Filtered notifications fetched successfully',
      data: notifications,
      meta:{
        page,
        limit,
        total,
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 