const { ROLES } = require("../../constants/databaseEnums");
const Notification = require("../../models/notification");
const mongoose = require("mongoose");

module.exports = async (req, res) => {
  try {
    const userId = req.user.id;
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
      return res.unAuthorized({ message: "Only super admins can access this endpoint." });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { unitId, status, sort = "-createdAt" } = req.query;

    const query = { createdBy: userId, recipientId: userId };

    if (status) {
      query.status = status;
    }

    if (unitId) {
      query["metadata.unitId"] = new mongoose.Types.ObjectId(unitId);
    }

    // Convert sort param string into actual sort object
    const sortField = sort.replace("-", "");
    const sortOrder = sort.startsWith("-") ? -1 : 1;
    const sortObj = { [sortField]: sortOrder };

    const notifications = await Notification.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return res.success({
      message: "Notifications created by you fetched successfully",
      data: notifications,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getCreatedByNotificationsService:", error);
    return res.internalServerError({ message: error.message });
  }
}; 