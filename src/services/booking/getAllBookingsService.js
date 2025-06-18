const Booking = require('../../models/booking');

module.exports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId, propertyId } = req.query;
    const query = {};

    if (status) query.bookingStatus = status;
    if (customerId) query.customerId = customerId;
    if (propertyId) query.propertyId = propertyId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    return res.success({
      data: bookings,
      meta: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};