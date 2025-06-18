const PricingProfile = require('../../models/pricingProfile');

module.exports = async (req, res) => {
  try {
    const {
      search,
      isActive,
      minMonthlyPrice,
      maxMonthlyPrice,
      minYearlyPrice,
      maxYearlyPrice,
      minDiscount,
      maxDiscount,
      sortBy = 'createdAt', // default sort field
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // 🔍 Search across multiple fields including numeric
    if (search) {
      const regex = new RegExp(search, 'i');
      const searchNumber = Number(search);
      const isNumeric = !isNaN(searchNumber);

      filter.$or = [
        { name: regex },
        ...(isNumeric
          ? [
              { monthlyCharge: searchNumber },
              { yearlyCharge: searchNumber },
              { monthlyDiscount: searchNumber },
              { yearlyDiscount: searchNumber }
            ]
          : [])
      ];
    }

    // ✅ Status filter
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    // 💰 Monthly price range
    if (minMonthlyPrice || maxMonthlyPrice) {
      const range = {};
      if (minMonthlyPrice) range.$gte = Number(minMonthlyPrice);
      if (maxMonthlyPrice) range.$lte = Number(maxMonthlyPrice);
      if (Object.keys(range).length > 0) {
        filter.monthlyCharge = range;
      }
    }

    // 💰 Yearly price range
    if (minYearlyPrice || maxYearlyPrice) {
      const range = {};
      if (minYearlyPrice) range.$gte = Number(minYearlyPrice);
      if (maxYearlyPrice) range.$lte = Number(maxYearlyPrice);
      if (Object.keys(range).length > 0) {
        filter.yearlyCharge = range;
      }
    }

    // 🎯 Discount filter (monthly/yearly)
    if (minDiscount || maxDiscount) {
      const discountRange = {};
      if (minDiscount) discountRange.$gte = Number(minDiscount);
      if (maxDiscount) discountRange.$lte = Number(maxDiscount);

      if (Object.keys(discountRange).length > 0) {
        filter.$or = filter.$or || [];
        filter.$or.push(
          { monthlyDiscount: discountRange },
          { yearlyDiscount: discountRange }
        );
      }
    }

    // ⏳ Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // ↕️ Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 📦 Query + Count
    const [profiles, total] = await Promise.all([
      PricingProfile.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      PricingProfile.countDocuments(filter)
    ]);

    return res.success({
      data: profiles,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pricing profiles:', error);
    return res.internalServerError({
      message: 'Failed to fetch pricing profiles',
      data: { errors: error.message }
    });
  }
};
