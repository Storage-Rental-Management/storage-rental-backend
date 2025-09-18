const Booking = require('../../models/booking');
const Payment = require('../../models/payment');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const { tab } = req.query;
    const customerId = req.user.id;
    const filter = { customerId, isDeleted: { $ne: true } };

    if (tab === 'complete') {
      filter.bookingStatus = { $in: [BOOKING_STATUS.BOOKING_CANCELLED, BOOKING_STATUS.BOOKING_EXPIRED, BOOKING_STATUS.BOOKING_CONFIRMED] };
    } else if (tab === 'ongoing') {
      filter.bookingStatus = { $nin: [BOOKING_STATUS.BOOKING_CANCELLED, BOOKING_STATUS.BOOKING_EXPIRED, BOOKING_STATUS.BOOKING_CONFIRMED] };
    }

    let bookings = await Booking.find(filter)
    .populate('unitId')
    .populate({
      path: 'propertyId',
      populate: {
        path: 'ownerId',
        select: 'paymentInstructions'
      }
    })
    .sort({ createdAt: -1 });

    bookings = await Promise.all(bookings.map(async (booking) => {
      const payment = await Payment
        .find({ bookingId: booking._id })
        .sort({ createdAt: -1 })
        // .select('_id transactionId amount currency paymentMethod paymentPeriod status invoiceLink');

      return {
        ...booking.toObject(),
        lastPayment: payment || null,
        paymentInstructions: booking?.propertyId?.ownerId ? booking.propertyId.ownerId.paymentInstructions : { cheque: '', eTransfer: '', cash: '' }
      };
    }));
    
    return res.success({ 
      message: "Booking For user retrieve successfully.",
      data: bookings 
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}; 