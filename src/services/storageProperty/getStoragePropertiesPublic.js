const StorageProperty = require("../../models/storageProperty");
const NodeGeocoder = require('node-geocoder');
const options = require("../../config/locationConfig");

// Using callback
module.exports = async (req, res) => {
  try {
    const {
      search,
      status,
      isApproved,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
      isFeatured,
      city,
      state,
      lat,
      lng,
      distance = 10000,
      minPrice,
      maxPrice,
      minYearlyPrice,
      maxYearlyPrice,
      unitType
    } = req.query;

    const filter = {};
    let geocoderData = [];
    let useGeoQuery = false;

    // Multi-field search
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
      ];

      const geocoder = NodeGeocoder(options);
      geocoderData = await geocoder.geocode(search);
    }

    // City & State filter
    if (city) filter.city = city;
    if (state) filter.state = state;

    // Status filter - default to active properties only
    filter.status = status || "active";

    // Featured filter
    if (typeof isFeatured !== "undefined") {
      filter.isFeatured = isFeatured === "true";
    }

    // Geo filter
    let latitude, longitude;
    if ((lat && lng) || (geocoderData.length && geocoderData[0].latitude && geocoderData[0].longitude)) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lng);
      if (geocoderData.length && geocoderData[0].latitude && geocoderData[0].longitude) {
        latitude = geocoderData[0].latitude;
        longitude = geocoderData[0].longitude;
      }

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

    // Unit price filter for lookup pipeline
    const unitPriceMatch = {};
    if (minPrice || maxPrice) {
      unitPriceMatch.monthlyCharge = {};
      if (minPrice) unitPriceMatch.monthlyCharge.$gte = Number(minPrice);
      if (maxPrice) unitPriceMatch.monthlyCharge.$lte = Number(maxPrice);
    }
    if (minYearlyPrice || maxYearlyPrice) {
      unitPriceMatch.yearlyCharge = {};
      if (minYearlyPrice) unitPriceMatch.yearlyCharge.$gte = Number(minYearlyPrice);
      if (maxYearlyPrice) unitPriceMatch.yearlyCharge.$lte = Number(maxYearlyPrice);
    }

    // Unit type filter for lookup pipeline
    let unitTypeArray = [];
    if (unitType) {
      unitTypeArray = Array.isArray(unitType)
      ? unitType
      : unitType.split(",").map((t) => t.trim());
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrderValue = sortOrder === "asc" ? 1 : -1;

    // Aggregation pipeline
    const dataPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "storageunits",
          let: { propertyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$propertyId", "$$propertyId"] },
                status: "available",
                ...(Object.keys(unitPriceMatch).length ? unitPriceMatch : {}),
                ...(unitTypeArray.length
                  ? { unitType: { $in: unitTypeArray } }
                  : {}),
              },
            },
          ],
          as: "filteredUnits",
        },
      },
      // Only keep properties with at least one matching unit if price filter is used
      ...(Object.keys(unitPriceMatch).length || unitTypeArray.length
        ? [{ $match: { "filteredUnits.0": { $exists: true } } }]
        : []),
      {
        $project: {
          location: 1,
          companyName: 1,
          email: 1,
          mobileNumber: 1,
          address: 1,
          city: 1,
          state: 1,
          description: 1,
          propertyImage: 1,
          unitCount: 1,
          activeCount: 1,
          status: 1,
          isApproved: 1,
          isDeleted: 1,
          isFeatured: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { [sortBy]: sortOrderValue } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const countPipeline = [
      ...dataPipeline.slice(0, -3), // up to $project or $match
      { $count: "total" },
    ];

    const [properties, countResult] = await Promise.all([
      StorageProperty.aggregate(dataPipeline),
      StorageProperty.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      data: properties,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch properties",
      data: { errors: error.message },
    });
  }
};