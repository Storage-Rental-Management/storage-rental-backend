const User = require("../../models/user");
const Role = require("../../models/role");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const {
      role,
      status,
      startDate,
      endDate,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { isDeleted: false };

    // Exclude SUPER_ADMIN
    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });
    if (superAdminRole) {
      query.role = { $ne: superAdminRole._id };
    }

    // Role filter
    if (role) {
      const matchedRole = await Role.findOne({ name: role });
      if (!matchedRole) {
        return res.badRequest({ message: "Invalid role filter" });
      }
      query.role = matchedRole._id;
    }

    // Status filter
    if (status) {
      const userStatus = Array.isArray(status)
        ? status
        : status.split(",").map((t) => t.trim());
      query.status = { $in: userStatus };
    }

    // Date range filter
    if (startDate || endDate) {
      query.joinedAt = {};
      if (startDate) query.joinedAt.$gte = new Date(startDate);
      if (endDate) query.joinedAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      const numberSearch = Number(search);
      const isNumber = !isNaN(numberSearch);

      query.$or = [
        { username: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ];

      // For number search in phone
      if (isNumber) {
        query.$or.push({ phone: numberSearch });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy || "createdAt"] = sortOrder === "asc" ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .populate("role", "name")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return res.success({
      message: "Users fetched successfully",
      data: users,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
