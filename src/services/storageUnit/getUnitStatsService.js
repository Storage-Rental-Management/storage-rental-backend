const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const User = require("../../models/user");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    let filter = {};

    if (propertyId) {
      filter.propertyId = propertyId;
    } else {
      if (user?.role?.name === ROLES.SUPER_ADMIN) {
      } else {
        const userProperties = await StorageProperty.find(
          { ownerId: userId },
          "_id"
        );
        const propertyIds = userProperties.map((p) => p._id);

        if (!propertyIds.length) {
          const stats = {
            total: 0,
            occupied: 0,
            reserved: 0,
            available: 0,
            totalBooked: 0,
            utilizationRate: `0%`,
          };

          return res.success({
            message: "No units found for this user",
            data: stats,
          });
        }

        filter.propertyId = { $in: propertyIds };
      }
    }

    // Get counts for different unit statuses
    const [totalUnits, occupiedUnits, reservedUnits, availableUnits] =
      await Promise.all([
        // Total units (all units)
        StorageUnit.countDocuments(filter),

        // Occupied units
        StorageUnit.countDocuments({ ...filter, status: "occupied" }),

        // Reserved units
        StorageUnit.countDocuments({ ...filter, status: "reserved" }),

        // Available units
        StorageUnit.countDocuments({ ...filter, status: "available" }),
      ]);

    // Calculate additional stats
    const totalBookedUnits = occupiedUnits + reservedUnits;
    const utilizationRate =
      totalUnits > 0 ? ((totalBookedUnits / totalUnits) * 100).toFixed(2) : 0;

    const stats = {
      total: totalUnits,
      occupied: occupiedUnits,
      reserved: reservedUnits,
      available: availableUnits,
      totalBooked: totalBookedUnits,
      utilizationRate: `${utilizationRate}%`,
    };

    return res.success({
      message: "Unit statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch unit statistics",
      data: { errors: error.message },
    });
  }
};
