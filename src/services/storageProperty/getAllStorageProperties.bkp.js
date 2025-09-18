const { ROLES } = require("../../constants/databaseEnums");
const StorageProperty = require("../../models/storageProperty");
const User = require("../../models/user");
const mongoose = require("mongoose");

module.exports = async (req, res) => {
  try {
    const {
      status,
      isApproved,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { $and: [] };

    // Search
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$and.push({
        $or: [
          { companyName: regex },
          { status: regex },
          { email: regex },
          { mobileNumber: regex },
          { address: regex },
        ],
      });
    }

    // Status filter
    if (status) {
      filter.$and.push({ status });
    }

    // Approval filter
    if (typeof isApproved !== "undefined") {
      filter.$and.push({ isApproved: isApproved === "true" });
    }

    // Apply ownership restriction
    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      filter.$and.push({
        $or: [
          { ownerId: userId },
          { ownerId: new mongoose.Types.ObjectId(userId) },
        ],
      });
    }

    // Remove $and if empty (no filters)
    if (filter.$and.length === 0) delete filter.$and;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrderValue = sortOrder === "asc" ? 1 : -1;

    // Validate sortBy field
    const allowedSortFields = ["createdAt", "companyName", "_id", "updatedAt"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Aggregation pipeline for data
    const dataPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "storageunits",
          localField: "_id",
          foreignField: "propertyId",
          as: "units",
        },
      },
      {
        $addFields: {
          unitCount: { $size: "$units" },
        },
      },
      {
        $project: {
          units: 0,
        },
      },
      { $sort: { [safeSortBy]: sortOrderValue } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    // Aggregation pipeline for count
    const countPipeline = [{ $match: filter }, { $count: "total" }];

    // Run both in parallel
    const [properties, countResult] = await Promise.all([
      StorageProperty.aggregate(dataPipeline),
      StorageProperty.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Storage properties fetched successfully",
      data: properties,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch properties",
      data: { errors: error.message },
    });
  }
};
