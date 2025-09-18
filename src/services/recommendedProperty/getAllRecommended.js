const RecommendedProperty = require("../../models/recommendedProperty");
const User = require("../../models/user");
const mongoose = require("mongoose");
const { ROLES, RECOMMENDED_STATUS } = require("../../constants/databaseEnums");

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
    const user = await User.findById(userId).populate("role");

    if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role?.name)) {
      return res.unAuthorized({ message: "Access denied" });
    }

    const matchStage = {};

    // Role-based filter: admin → temni requests, superAdmin → badha
    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      matchStage.requesterId = new mongoose.Types.ObjectId(userId);
    }

    // Status filter
    if (status) {
      const recStatus = Array.isArray(status)
        ? status
        : status.split(",").map((t) => t.trim());
      matchStage.status = { $in: recStatus };
    } else if (user?.role?.name === ROLES.SUPER_ADMIN) {
      matchStage.status = {
        $in: [
          RECOMMENDED_STATUS.UNDER_REVIEW,
          RECOMMENDED_STATUS.APPROVED,
          RECOMMENDED_STATUS.REJECTED,
        ],
      };
    }

    // Date filter
    if (startDate || endDate) {
      matchStage.startDate = {};
      if (startDate) matchStage.startDate.$gte = new Date(startDate);
      if (endDate) matchStage.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortVal = sortOrder === "asc" ? 1 : -1;

    const pipeline = [{ $match: matchStage }];

    // Lookup requester
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "requesterId",
          foreignField: "_id",
          as: "requester",
        },
      },
      { $unwind: { path: "$requester", preserveNullAndEmptyArrays: true } }
    );

    // Lookup property
    pipeline.push(
      {
        $lookup: {
          from: "storageproperties",
          localField: "propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } }
    );

    // Lookup unit
    pipeline.push(
      {
        $lookup: {
          from: "storageunits",
          localField: "unitId",
          foreignField: "_id",
          as: "unit",
        },
      },
      { $unwind: { path: "$unit", preserveNullAndEmptyArrays: true } }
    );

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { description: { $regex: regex } },
            { "requester.username": { $regex: regex } },
            { "requester.email": { $regex: regex } },
            { "property.companyName": { $regex: regex } },
            { "unit.name": { $regex: regex } },
          ],
        },
      });
    }

    // Count pipeline
    const countPipeline = [...pipeline, { $count: "total" }];

    // Sort, skip, limit
    pipeline.push(
      { $sort: { [sortBy]: sortVal } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Project only required fields
    pipeline.push({
      $project: {
        _id: 1,
        requesterId: 1,
        recommendedCode: 1,
        propertyId: 1,
        unitId: 1,
        startDate: 1,
        endDate: 1,
        description: 1,
        status: 1,
        recommendedFor: 1,
        createdAt: 1,
        updatedAt: 1,
        requester: {
          _id: 1,
          username: 1,
          email: 1,
        },
        propertyName: "$property.companyName",
        propertyImage: "$property.propertyImage",
        unitName: "$unit.name",
        unitImage: "$unit.unitImage",
      },
    });

    // Fetch data
    const [recommended, countResult] = await Promise.all([
      RecommendedProperty.aggregate(pipeline),
      RecommendedProperty.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Recommended properties fetched successfully",
      data: recommended,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Fetch Recommended Properties Error:", error);
    return res.internalServerError({
      message: "Failed to fetch recommended properties",
      error: error.message,
    });
  }
};
