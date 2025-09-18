const Booking = require('../../models/booking');
const StorageUnit = require('../../models/storageUnit');
const StorageProperty = require('../../models/storageProperty');
const { BOOKING_STATUS, STORAGE_UNIT_STATUS } = require('../../constants/databaseEnums');

/**
 * Handle auto-expiry of bookings ending this month.
 * Marks expired bookings and updates associated unit status to available.
 */
module.exports = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Find all bookings that have expired this month (endDate < today but within current month)
    const expiredBookings = await Booking.find({
      endDate: { 
        $gte: startOfMonth, 
        $lte: endOfMonth,
        $lt: today 
      },
      bookingStatus: { $ne: BOOKING_STATUS.BOOKING_EXPIRED }
    }).populate('unitId');

    console.log(`Found ${expiredBookings.length} expired bookings to process`);

    for (const booking of expiredBookings) {
      // Mark booking as expired
      await Booking.findByIdAndUpdate(booking._id, {
        bookingStatus: BOOKING_STATUS.BOOKING_EXPIRED,
        updatedAt: new Date()
      });

      // Update associated unit status to available
      if (booking.unitId) {
        await StorageUnit.findByIdAndUpdate(booking.unitId, {
          status: STORAGE_UNIT_STATUS.AVAILABLE,
          isAvailable: true,
          updatedAt: new Date()
        });
        
        await StorageProperty.findByIdAndUpdate(
          booking.propertyId,
          { $inc: { activeCount: -1 } },
          { new: true }
        );
      }

      console.log(`Processed expired booking: ${booking._id}, Unit: ${booking.unitId?._id || 'N/A'}`);
    }

    return {
      message: 'Booking expiry handler completed successfully',
      data: {
        processedCount: expiredBookings.length
      }
    };

  } catch (error) {
    console.error('Booking Expiry Handler Error:', error);
  }
}; 