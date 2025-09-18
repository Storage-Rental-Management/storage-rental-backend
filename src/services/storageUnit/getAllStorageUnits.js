const { ROLES } = require("../../constants/databaseEnums");
const StorageUnit = require("../../models/storageUnit");
const storageProperty = require("../../models/storageProperty");
const Payment = require("../../models/payment");
const User = require("../../models/user");
const mongoose = require("mongoose");

module.exports = async (req, res) => {
  try {
    const {
      propertyId,
      unitType,
      status,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    // Filters
    const matchStage = {};

    // Role-based access (admin gets only their property units)
    if (propertyId) {
      matchStage.propertyId = new mongoose.Types.ObjectId(propertyId);
    } else if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      const userProperties = await storageProperty.find(
        { ownerId: userId },
        "_id"
      );
      const userPropertyIds = userProperties.map(
        (p) => new mongoose.Types.ObjectId(p._id)
      );
      matchStage.propertyId = { $in: userPropertyIds };
    }

    if (unitType) {
      const types = Array.isArray(unitType)
        ? unitType
        : unitType.split(",").map((t) => t.trim());
      matchStage.unitType = { $in: types };
    }

    if (status) {
      const unitStatus = Array.isArray(status)
        ? status
        : status.split(",").map((t) => t.trim());
      matchStage.status = { $in: unitStatus };
    }

    if (minPrice || maxPrice) {
      matchStage.monthlyCharge = {};
      if (minPrice) matchStage.monthlyCharge.$gte = Number(minPrice);
      if (maxPrice) matchStage.monthlyCharge.$lte = Number(maxPrice);
    }

    // Search fields
    const stringFields = [
      "name",
      "description",
      "unitType",
      "size",
      "paymentMethod",
      "status",
    ];
    const numericFields = [
      "monthlyCharge",
      "yearlyCharge",
      "monthlyDiscount",
      "yearlyDiscount",
    ];

    const searchStage = [];
    if (search) {
      const regex = new RegExp(search, "i");

      stringFields.forEach((field) => {
        searchStage.push({ [field]: { $regex: regex } });
      });

      numericFields.forEach((field) => {
        searchStage.push({
          $expr: {
            $regexMatch: {
              input: { $toString: `$${field}` },
              regex: search,
              options: "i",
            },
          },
        });
      });
    }

    // Pagination & Sorting
    const skip = (Number(page) - 1) * Number(limit);
    const sortStage = {};
    sortStage[sortBy || "createdAt"] = sortOrder === "asc" ? 1 : -1;

    // Aggregation Pipeline
    const pipeline = [];

    if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage });
    if (searchStage.length) pipeline.push({ $match: { $or: searchStage } });

    // Add lookup for payment information (only for occupied units)
    pipeline.push({
      $lookup: {
        from: "payments",
        let: { unitId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$unitId", "$$unitId"] },
              status: { $in: ["succeeded", "completed", "paid", "pending"] },
            },
          },
          {
            $sort: { updatedAt: -1 },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              paymentMethod: 1,
              status: 1,
              paymentPeriod: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: "latestPayment",
      },
    });

    // Add computed fields for payment info
    pipeline.push({
      $addFields: {
        paymentInfo: {
          $switch: {
            branches: [
              {
                // If unit is occupied → normal payment info
                case: { $eq: ["$status", "occupied"] },
                then: {
                  paymentMethod: {
                    $arrayElemAt: ["$latestPayment.paymentMethod", 0],
                  },
                  latestPaymentStatus: {
                    $concat: [
                      {
                        $dateToString: {
                          format: "%b",
                          date: {
                            $arrayElemAt: ["$latestPayment.updatedAt", 0],
                          },
                        },
                      },
                      " (",
                      {
                        $switch: {
                          branches: [
                            {
                              case: {
                                $in: [
                                  {
                                    $arrayElemAt: ["$latestPayment.status", 0],
                                  },
                                  ["completed", "succeeded", "paid"],
                                ],
                              },
                              then: "Paid",
                            },
                            {
                              case: {
                                $eq: [
                                  {
                                    $arrayElemAt: ["$latestPayment.status", 0],
                                  },
                                  "pending",
                                ],
                              },
                              then: "Pending",
                            },
                          ],
                          default: "Unknown",
                        },
                      },
                      ")",
                    ],
                  },
                },
              },
              {
                // If unit is available → show last payment with "(Last)"
                case: { $eq: ["$status", "available"] },
                then: {
                  paymentMethod: {
                    $arrayElemAt: ["$latestPayment.paymentMethod", 0],
                  },
                  latestPaymentStatus: {
                    $concat: [
                      {
                        $dateToString: {
                          format: "%b",
                          date: {
                            $arrayElemAt: ["$latestPayment.updatedAt", 0],
                          },
                        },
                      },
                      " (",
                      {
                        $switch: {
                          branches: [
                            {
                              case: {
                                $in: [
                                  {
                                    $arrayElemAt: ["$latestPayment.status", 0],
                                  },
                                  ["completed", "succeeded", "paid"],
                                ],
                              },
                              then: "Paid - Last",
                            },
                            {
                              case: {
                                $eq: [
                                  {
                                    $arrayElemAt: ["$latestPayment.status", 0],
                                  },
                                  "pending",
                                ],
                              },
                              then: "Pending - Last",
                            },
                          ],
                          default: "Unknown",
                        },
                      },
                      ")",
                    ],
                  },
                },
              },
            ],
            default: null,
          },
        },
      },
    });

    // Remove the latestPayment array from final output
    pipeline.push({
      $project: {
        latestPayment: 0,
      },
    });

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const countPipeline = [...pipeline];
    countPipeline.splice(
      countPipeline.findIndex((p) => "$sort" in p),
      countPipeline.length
    );

    countPipeline.push({ $count: "total" });

    const [units, countResult] = await Promise.all([
      StorageUnit.aggregate(pipeline),
      StorageUnit.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Storage units fetched successfully",
      data: units,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch units",
      error: error.message,
    });
  }
};
