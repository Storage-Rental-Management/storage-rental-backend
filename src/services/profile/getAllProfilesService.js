const User = require('../../models/user');
const Role = require('../../models/role');
const { ROLES } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const {
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = { isDeleted: false };

    // Exclude SUPER_ADMIN role
    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });
    const roleFilters = [];

    if (superAdminRole) {
      roleFilters.push({ role: { $ne: superAdminRole._id } });
    }

    // If a role is provided in query
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) return res.badRequest({ message: 'Invalid role filter' });
      roleFilters.push({ role: roleDoc._id });
    }

    // Merge role filters if needed
    if (roleFilters.length > 0) {
      query.$and = roleFilters;
    }

    // Search logic
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Status
    if (status) query.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort(sort).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    return res.success({
      data: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.internalServerError({ message: error.message });
  }
};
