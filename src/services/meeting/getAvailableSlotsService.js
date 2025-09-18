const Meeting = require('../../models/meeting');
const User = require('../../models/user');
const moment = require('moment-timezone');
const StorageUnit = require('../../models/storageUnit');
const StorageProperty = require('../../models/storageProperty');

module.exports = async (req, res) => {
  try {
    const { date, unitId } = req.query;
    const organizerId = req.user.id;

    if (!date) {
      return res.badRequest({ message: 'Date is required.' });
    }

    const userTimezone = 'Asia/Kolkata'; // IST
    const requestedDate = moment.tz(date, userTimezone).startOf('day');
    const now = moment.tz(userTimezone);

    if (requestedDate.isBefore(now, 'day')) {
      return res.badRequest({ message: 'Cannot get slots for a past date.' });
    }

    // --- Configuration ---
    const businessHours = {
      start: { hour: 0, minute: 0 },
      end: { hour: 23, minute: 59 },
    };
    const slotDuration = 30; // in minutes

    const availableSlots = [];
    let currentTime = requestedDate.clone().set(businessHours.start);
    const endTime = requestedDate.clone().set(businessHours.end);

    // --- Get OwnerId from Property via Unit ---
    let ownerId = null;
    let adminUser = null;

    if (unitId) {
      const unit = await StorageUnit.findById(unitId);
      if (unit) {
        const property = await StorageProperty.findById(unit.propertyId).lean();
        if (property && property.ownerId) {
          ownerId = property.ownerId;
          adminUser = await User.findById(ownerId).select('bookedSlots').lean();
        }
      }
    }

    if (!ownerId) {
      return res.badRequest({ message: 'Invalid unit or property. Owner not found.' });
    }

    // --- Existing Meetings for Owner ---
    const startOfDay = requestedDate.clone().startOf('day');
    const endOfDay = requestedDate.clone().endOf('day');

    const existingMeetings = await Meeting.find({
      scheduledFor: {
        $gte: startOfDay.utc().toDate(),
        $lt: endOfDay.utc().toDate()
      },
      meetingStatus: { $nin: ['meeting-rejected', 'meeting-cancelled'] },
      $or: [
        { organizerId: organizerId },
        { attendeeId: ownerId }
      ]
    }).select('scheduledFor');

    const meetingBookedTimes = existingMeetings.map(m =>
      moment.tz(m.scheduledFor, userTimezone).valueOf()
    );

    // --- Admin Masterdata bookedSlots ---
    let adminBookedTimes = [];
    if (adminUser?.bookedSlots?.length > 0) {
      adminBookedTimes = adminUser.bookedSlots
        .filter(slot => moment.tz(slot, userTimezone).isSame(requestedDate, 'day'))
        .map(slot => moment.tz(slot, userTimezone).valueOf());
    }

    // Combine all booked times
    const bookedTimes = [...new Set([...meetingBookedTimes, ...adminBookedTimes])];

    // --- Slot Generation ---
    while (currentTime.isBefore(endTime)) {
      const slotStart = currentTime.clone();
      const slotEnd = currentTime.clone().add(slotDuration, 'minutes');
      const isInFuture = slotStart.isAfter(now);

      if (isInFuture) {
        const isBooked = bookedTimes.includes(slotStart.valueOf());
        if (!isBooked) {
          availableSlots.push({
            startTime: slotStart.utc().toISOString(),
            endTime: slotEnd.utc().toISOString(),
          });
        }
      }

      currentTime.add(slotDuration, 'minutes');
    }

    return res.success({
      message: 'Available slots retrieved successfully.',
      data: availableSlots
    });

  } catch (error) {
    console.error('Error in get-available-slots:', error);
    return res.internalServerError({ message: error.message });
  }
};
