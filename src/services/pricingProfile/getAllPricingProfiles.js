const mongoose = require("mongoose");
const { ROLES } = require("../../constants/databaseEnums");
const PricingProfile = require("../../models/pricingProfile");
const User = require("../../models/user");

module.exports = async (req, res) => {
  try {
    const {
      isActive,
      minMonthlyPrice,
      maxMonthlyPrice,
      minYearlyPrice,
      maxYearlyPrice,
      minDiscount,
      maxDiscount,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    const matchStage = {};

    // Role-based access control
    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    // Basic filters
    if (typeof isActive !== "undefined") {
      matchStage.isActive = isActive === "true";
    }

    if (minMonthlyPrice || maxMonthlyPrice) {
      matchStage.monthlyCharge = {};
      if (minMonthlyPrice)
        matchStage.monthlyCharge.$gte = Number(minMonthlyPrice);
      if (maxMonthlyPrice)
        matchStage.monthlyCharge.$lte = Number(maxMonthlyPrice);
    }

    if (minYearlyPrice || maxYearlyPrice) {
      matchStage.yearlyCharge = {};
      if (minYearlyPrice) matchStage.yearlyCharge.$gte = Number(minYearlyPrice);
      if (maxYearlyPrice) matchStage.yearlyCharge.$lte = Number(maxYearlyPrice);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortValue = sortOrder === "asc" ? 1 : -1;

    const pipeline = [{ $match: matchStage }];

    // Search & Discount filter using $expr
    const searchConditions = [];

    if (search) {
      const regex = new RegExp(search, "i");
      const numSearch = Number(search);
      const isNumber = !isNaN(numSearch);

      searchConditions.push({ name: { $regex: regex } });

      if (isNumber) {
        const numericFields = [
          "monthlyCharge",
          "yearlyCharge",
          "monthlyDiscount",
          "yearlyDiscount",
        ];
        numericFields.forEach((field) => {
          searchConditions.push({
            $expr: {
              $regexMatch: {
                input: { $toString: `$${field}` },
                regex: regex,
                options: "i",
              },
            },
          });
          searchConditions.push({ [field]: numSearch });
        });
      }
    }

    // Discount filter (dynamic range)
    if (minDiscount || maxDiscount) {
      const min = Number(minDiscount) || 0;
      const max = Number(maxDiscount) || 100;

      searchConditions.push({
        $or: [
          {
            $and: [
              { monthlyDiscount: { $gte: min } },
              { monthlyDiscount: { $lte: max } },
            ],
          },
          {
            $and: [
              { yearlyDiscount: { $gte: min } },
              { yearlyDiscount: { $lte: max } },
            ],
          },
        ],
      });
    }

    if (searchConditions.length > 0) {
      pipeline.push({ $match: { $or: searchConditions } });
    }

    // Total count pipeline
    const countPipeline = [...pipeline, { $count: "total" }];

    // Sort, Skip, Limit
    pipeline.push({ $sort: { [sortBy || 'createdAt']: sortValue } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const [data, countResult] = await Promise.all([
      PricingProfile.aggregate(pipeline),
      PricingProfile.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Pricing profiles fetched successfully",
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch pricing profiles",
      error: error.message,
    });
  }
};