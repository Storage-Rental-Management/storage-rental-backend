const Booking = require("../../models/booking");
const mongoose = require("mongoose");
const User = require("../../models/user");
const { ROLES, BOOKING_STATUS } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const {
      status,
      customerId,
      propertyId,
      unitId,
      startDate,
      endDate,
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

    if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role?.name)) {
      return res.unAuthorized({ message: "Access denied" });
    }

    const matchStage = {};

    // Filters
    if (customerId)
      matchStage.customerId = new mongoose.Types.ObjectId(customerId);
    if (propertyId)
      matchStage.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (unitId) matchStage.unitId = new mongoose.Types.ObjectId(unitId);

    // Date filter
    if (startDate || endDate) {
      matchStage.startDate = {};
      if (startDate) matchStage.startDate.$gte = new Date(startDate);
      if (endDate) matchStage.startDate.$lte = new Date(endDate);
    }

    // Price filter
    if (minPrice || maxPrice) {
      matchStage.totalAmount = {};
      if (minPrice) matchStage.totalAmount.$gte = Number(minPrice);
      if (maxPrice) matchStage.totalAmount.$lte = Number(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortVal = sortOrder === "asc" ? 1 : -1;
    const safeSortBy = sortBy || "createdAt";

    const pipeline = [{ $match: matchStage }];

    // Populate: customer, property, unit
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "storageproperties",
          localField: "propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
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

    // unitType Filtering
    if (req.query.unitType) {
      let unitTypes = [];
      if (Array.isArray(req.query.unitType)) {
        unitTypes = req.query.unitType.map((type) => type.trim());
      } else {
        unitTypes = req.query.unitType.split(",").map((type) => type.trim());
      }
      pipeline.push({
        $match: {
          "unit.unitType": { $in: unitTypes },
        },
      });
    }

    // booking status expired filter unit wise

    if (req.query.onlyExpired === "true") {
      // matchStage.bookingStatus = BOOKING_STATUS.BOOKING_EXPIRED;
      matchStage.bookingStatus = { $in: [BOOKING_STATUS.BOOKING_EXPIRED, BOOKING_STATUS.BOOKING_CANCELLED] }
    }
    
    // status Filtering
    if (req.query.status) {
      let statuses = [];
      if (Array.isArray(req.query.status)) {
        statuses = req.query.status.map((s) => s.trim());
      } else {
        statuses = req.query.status.split(",").map((s) => s.trim());
      }

      const prefixes = ["meeting", "documents", "payment", "booking"];
      const orConditions = statuses.map((status) => {
        if (prefixes.includes(status)) {
          return { bookingStatus: { $regex: `^${status}`, $options: "i" } };
        } else {
          return { bookingStatus: status };
        }
      });

      pipeline.push({
        $match: {
          $or: orConditions,
        },
      });
    }

    // Search
    if (search) {
      const regex = new RegExp(search, "i");
      const num = Number(search);
      const isNum = !isNaN(num);

      pipeline.push({
        $match: {
          $or: [
            { paymentStatus: { $regex: regex } },
            { bookingStatus: { $regex: regex } },
            { payment_period: { $regex: regex } },
            { "customer.username": { $regex: regex } },
            { "customer.email": { $regex: regex } },
            { "property.companyName": { $regex: regex } },
            { "unit.name": { $regex: regex } },
            { "unit.unitType": { $regex: regex } },
            ...(isNum ? [{ totalAmount: num }] : []),
          ],
        },
      });
    }

    // Count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];

    // Sort, skip, limit
    pipeline.push(
      { $sort: { [safeSortBy]: sortVal } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const [bookings, countResult] = await Promise.all([
      Booking.aggregate(pipeline),
      Booking.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Bookings fetched successfully",
      data: bookings,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};
