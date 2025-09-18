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
      country,
      city,
      state,
      lat,
      lng,
      distance = 10000,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { $and: [] };
    let useGeoQuery = false;

    // 🔍 Search
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { companyName: regex },
        { status: regex },
        { email: regex },
        { mobileNumber: regex },
        { address: regex },
        { city: regex },
        { state: regex },
        { country: regex },
      ];
    }

    // 🏳️ Filters
    if (country) filter.country = country;
    if (city) filter.city = city;
    if (state) filter.state = state;

    if (status) filter.status = status;
    if (typeof isApproved !== "undefined") {
      filter.isApproved = isApproved === "true";
    }

    // 🔐 Ownership restriction
    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      if (!filter.$and) filter.$and = [];
      filter.$and.push({
        $or: [
          { ownerId: userId },
          { ownerId: new mongoose.Types.ObjectId(userId) },
        ],
      });
    }

    // 📍 Geolocation filter
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        useGeoQuery = true;

        filter.location = {
          $geoWithin: {
            $centerSphere: [
              [longitude, latitude],
              parseInt(distance) / 6378100,
            ],
          },
        };
      }
    }

    // ⏳ Pagination + Sorting
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrderValue = sortOrder === "asc" ? 1 : -1;

    const allowedSortFields = [
      "createdAt",
      "companyName",
      "_id",
      "updatedAt",
      "city",
      "state",
      "country",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    let query;

    // 🌍 Distance-based aggregation
    if (useGeoQuery && safeSortBy === "distance") {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      const matchStage = { ...filter };
      delete matchStage.location;

      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
            distanceField: "distance",
            maxDistance: parseInt(distance),
            spherical: true,
            query: matchStage,
          },
        },
        { $skip: skip },
        { $limit: Number(limit) },
      ];

      const countPipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
            distanceField: "distance",
            maxDistance: parseInt(distance),
            spherical: true,
            query: matchStage,
          },
        },
        { $count: "total" },
      ];

      const [properties, countResult] = await Promise.all([
        StorageProperty.aggregate(pipeline),
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
    } else {
      // 🔎 Regular query
      const [properties, total] = await Promise.all([
        StorageProperty.find(filter)
          .sort({ [safeSortBy]: sortOrderValue })
          .skip(skip)
          .limit(Number(limit)),
        StorageProperty.countDocuments(filter),
      ]);

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
    }
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch properties",
      data: { errors: error.message },
    });
  }
};
