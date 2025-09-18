const { ROLES, AD_STATUS } = require("../../constants/databaseEnums");
const Advertisement = require("../../models/advertisement");
const User = require("../../models/user");
const mongoose = require("mongoose");

module.exports = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user.id;
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrderVal = sortOrder === "asc" ? 1 : -1;

    const user = await User.findById(userId).populate("role");

    const matchStage = {};

    // Role-based restriction
    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      matchStage.requesterId = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      const adStatus = Array.isArray(status)
        ? status
        : status.split(",").map((t) => t.trim());
      matchStage.status = { $in: adStatus };
    } else if (user?.role?.name === ROLES.SUPER_ADMIN) {
      matchStage.status = {
        $in: [
          AD_STATUS.AD_UNDER_REVIEW,
          AD_STATUS.AD_APPROVED,
          AD_STATUS.AD_REJECTED,
        ],
      };
    }

    // Date filter
    if (startDate || endDate) {
      if (startDate && endDate) {
        matchStage.startDate = { $gte: new Date(startDate) };
        matchStage.endDate = { $lte: new Date(endDate) };
      } else if (startDate) {
        matchStage.startDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        matchStage.endDate = { $lte: new Date(endDate) };
      }
    }

    // Search filter
    const searchConditions = [];
    if (search) {
      const regex = new RegExp(search, "i");

      searchConditions.push({ adTitle: { $regex: regex } });
      searchConditions.push({ description: { $regex: regex } });
      searchConditions.push({ "requester.username": { $regex: regex } });
      searchConditions.push({ "requester.email": { $regex: regex } });
    }

    const pipeline = [];

    if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage });

    // Lookup requester
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "requesterId",
        foreignField: "_id",
        as: "requester",
      },
    });
    pipeline.push({ $unwind: "$requester" });

    // Apply search
    if (searchConditions.length > 0) {
      pipeline.push({
        $match: { $or: searchConditions },
      });
    }

    // Count pipeline
    const countPipeline = [...pipeline, { $count: "total" }];

    // Sort, Skip, Limit
    pipeline.push({ $sort: { [sortBy]: sortOrderVal } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    // Final fetch
    const [ads, countResult] = await Promise.all([
      Advertisement.aggregate(pipeline),
      Advertisement.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Advertisements fetched successfully",
      data: ads,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch advertisements",
      error: error.message,
    });
  }
};
