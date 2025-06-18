const StorageProperty = require('../../models/storageProperty');

module.exports = async (req, res) => {
  try {
    const {
      search,
      status,
      isApproved,
      sortBy = 'createdAt', // default sort
      sortOrder = 'desc',   // 'asc' or 'desc'
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // 🔍 Multi-field search
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { companyName: regex },
        { status: regex },
        { email: regex },
        { mobileNumber: regex },
        { address: regex },
      ];
    }

    // 📌 Filters
    if (status) filter.status = status;
    if (typeof isApproved !== 'undefined') filter.isApproved = isApproved === 'true';

    // ⏳ Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // ↕️ Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 📦 Query and count
    const [properties, total] = await Promise.all([
      StorageProperty.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      StorageProperty.countDocuments(filter)
    ]);

    return res.success({
      data: properties,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching storage properties:', error);
    return res.internalServerError({
      message: 'Failed to fetch properties',
      data: { errors: error.message }
    });
  }
};
