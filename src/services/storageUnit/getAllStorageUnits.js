const { StorageUnit } = require('../../models');

module.exports = async (req, res) => {
  try {
    const {
      search,
      propertyId,
      unitType,
      paymentMethod,
      size,
      status,
      isAvailable,
      minPrice,
      maxPrice,
      sortBy = 'createdAt', // default sort field
      sortOrder = 'desc',    // 'asc' or 'desc'
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // 🔍 Multi-field search
    if (search) {
      const regex = new RegExp(search, 'i');
      const numberSearch = Number(search);
      const isNumber = !isNaN(numberSearch);

      filter.$or = [
        { name: regex },
        { description: regex },
        { unitType: regex },
        { size: regex },
        { paymentMethod: regex },
        { status: regex },
      ];

      if (isNumber) {
        filter.$or.push(
          { monthlyCharge: numberSearch },
          { yearlyCharge: numberSearch },
          { monthlyDiscount: numberSearch },
          { yearlyDiscount: numberSearch }
        );
      }
    }

    // 🧱 Filters
    if (propertyId) filter.propertyId = propertyId;
    if (unitType) filter.unitType = unitType;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (size) filter.size = size;
    if (status) filter.status = status;
    if (typeof isAvailable !== 'undefined') filter.isAvailable = isAvailable === 'true';

    // 💰 Price range filter (based on monthlyCharge)
    if (minPrice || maxPrice) {
      const priceField = paymentMethod === 'yearly' ? 'yearlyCharge' : 'monthlyCharge';
      filter[priceField] = {};
      if (minPrice) filter[priceField].$gte = Number(minPrice);
      if (maxPrice) filter[priceField].$lte = Number(maxPrice);
    }

    // ⏳ Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // ↕️ Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 📦 Final query
    const [units, total] = await Promise.all([
      StorageUnit.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      StorageUnit.countDocuments(filter)
    ]);

    return res.success({
      data: units,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching storage units:', error);
    return res.internalServerError({
      message: 'Failed to fetch storage units',
      data: { errors: error.message }
    });
  }
};
