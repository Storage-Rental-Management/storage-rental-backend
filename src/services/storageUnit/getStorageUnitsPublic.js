const StorageUnit = require('../../models/storageUnit');
const StorageProperty = require('../../models/storageProperty');
const NodeGeocoder = require('node-geocoder');
const options = require("../../config/locationConfig");

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
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      isFeatured,
      city,
      state,
      lat,
      lng,
      distance = 100000 // in meters
    } = req.query;

    const filter = {};
    let geocoderData = [];

    // 🔍 Multi-field search
    if (search) {
      // const regex = new RegExp(search, 'i');
      const numberSearch = Number(search);
      const isNumber = !isNaN(numberSearch);

      // filter.$or = [
      //   { name: regex },
      //   { description: regex },
      //   { unitType: regex },
      //   { size: regex },
      //   { paymentMethod: regex },
      //   { status: regex },
      // ];

      if (isNumber) {
        filter.$or.push(
          { monthlyCharge: numberSearch },
          { yearlyCharge: numberSearch },
          { monthlyDiscount: numberSearch },
          { yearlyDiscount: numberSearch }
        );
      }

      const geocoder = NodeGeocoder(options);
      geocoderData = await geocoder.geocode(search);
    }

    // 🧱 Filters
    if (propertyId) filter.propertyId = propertyId;
    
    let unitTypeArray = [];
    if (unitType) {
      unitTypeArray = Array.isArray(unitType)
        ? unitType
        : unitType.split(',').map(t => t.trim());
      filter.unitType = { $in: unitTypeArray };
    }

    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (size) filter.size = size;
    
    // 📦 Status filter - default to available units only
    if (status) {
      filter.status = status;
    } else {
      // If no status is specified, only show available units
      filter.status = 'available';
    }
    
    // 🔓 Availability filter
    if (typeof isAvailable !== 'undefined') {
      filter.isAvailable = isAvailable === 'true';
    } else {
      filter.isAvailable = true;
    }

    if (typeof isFeatured !== 'undefined') {
      filter.isFeatured = isFeatured === 'true';
    }

    // 💰 Price range filter
    if (minPrice || maxPrice) {
      const priceField = paymentMethod === 'yearly' ? 'yearlyCharge' : 'monthlyCharge';
      filter[priceField] = {};
      if (minPrice) filter[priceField].$gte = Number(minPrice);
      if (maxPrice) filter[priceField].$lte = Number(maxPrice);
    }

    // Nearby units by property location
    let propertyIdsNearby = null;
    if ((lat && lng) || (geocoderData.length && geocoderData[0].latitude && geocoderData[0].longitude)) {
      let latitude = parseFloat(lat);
      let longitude = parseFloat(lng);
      if (geocoderData.length && geocoderData[0].latitude && geocoderData[0].longitude) {
        latitude = geocoderData[0].latitude;
        longitude = geocoderData[0].longitude;
      }
      if (!isNaN(latitude) && !isNaN(longitude)) {
        const nearbyProperties = await StorageProperty.find({
          location: {
            $nearSphere: {
              $geometry: { type: "Point", coordinates: [longitude, latitude] },
              $maxDistance: parseInt(distance)
            }
          }
        }, { _id: 1 });
        propertyIdsNearby = nearbyProperties.map(p => p._id.toString());
        if (propertyIdsNearby.length > 0) {
          filter.propertyId = { $in: propertyIdsNearby };
        } else if(search) {
          return res.json({
            success: true,
            message: 'Storage units fetched successfully',
            data: [],
            meta: {
              total: 0,
              page: Number(page),
              limit: Number(limit),
              pages: 0
            }
          });
        }
      }
    } else if(search) {
      return res.json({
        success: true,
        message: 'Storage units fetched successfully',
        data: [],
        meta: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          pages: 0
        }
      });
    }

    // ⏳ Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // ↕️ Sorting
    const sortOptions = {};
    sortOptions[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    // 📦 Final query
    let [units, total] = await Promise.all([
      StorageUnit.find(filter)
      .populate({
        path: 'propertyId',
        select: 'city state location',
        populate: {
          path: 'ownerId',
          select: 'paymentInstructions'
        }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit)),
      StorageUnit.countDocuments(filter)
    ]);
    
    if(units.length === 0 && lat && lng) {
      delete filter.propertyId;
      
      units = await StorageUnit.find(filter)
        .populate({
          path: 'propertyId',
          select: 'city state location',
          populate: {
            path: 'ownerId',
            select: 'paymentInstructions'
          }
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
    }

    if (city || state) {
      units = units.filter(unit => {
        const prop = unit.propertyId;
        if (!prop) return false;
        let cityMatch = true, stateMatch = true;
        if (city) cityMatch = prop.city && prop.city.toLowerCase() === city.toLowerCase();
        if (state) stateMatch = prop.state && prop.state.toLowerCase() === state.toLowerCase();
        return cityMatch && stateMatch;
      });
      total = units.length;
    }
    
    units = units.map(unit => {
      const prop = unit.propertyId || {};
      return {
        ...unit.toObject(),
        propertyId: prop._id || '',
        propertyCity: prop.city || '',
        propertyState: prop.state || '',
        paymentInstructions: prop.ownerId ? prop.ownerId.paymentInstructions : { cheque: '', eTransfer: '', cash: '' }
      };
    });
    

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
    return res.internalServerError({
      message: 'Failed to fetch storage units',
      data: { errors: error.message }
    });
  }
};
