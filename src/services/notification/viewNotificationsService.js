const { ROLES } = require("../../constants/databaseEnums");
const Notification = require("../../models/notification");
const mongoose = require("mongoose");
const User = require("../../models/user");

module.exports = async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { unitId, status, sort = "-createdAt" } = req.query;

    const query = {};

    query.recipientId = userId;

    if (status) {
      query.status = new RegExp(`^${status}$`, 'i');
    }

    if (unitId) {
      query["metadata.unitId"] = {
        $in: [
          unitId,
          new mongoose.Types.ObjectId(unitId)
        ]
      };
    }

    // 🧠 Convert sort param string into actual sort object
    const sortField = sort.replace("-", "");
    const sortOrder = sort.startsWith("-") ? -1 : 1;
    const sortObj = { [sortField]: sortOrder };

    const notifications = await Notification.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return res.success({
      message: "Notification list fetched successfully",
      data: notifications,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in viewNotificationsService:", error);
    return res.internalServerError({ message: error.message });
  }
};
