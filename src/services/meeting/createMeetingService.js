const Meeting = require('../../models/meeting');
const User = require('../../models/user');
const Booking = require('../../models/booking');
const StorageUnit = require('../../models/storageUnit');
const StorageProperty = require('../../models/storageProperty');
const { createMeetingSchema } = require('../../validation/meetingValidation');
const { sendMeetingRequestEmail } = require('../../resources/emailUtils');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');
const ActivityLog = require('../../models/activityLog');

module.exports = async (req, res) => {
  try {
    const { error } = createMeetingSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const userId = req.user.id;
    const { unitId } = req.body;

    // Validate unit and property
    const unit = await StorageUnit.findById(unitId);
    if (!unit) return res.recordNotFound({ message: 'Storage unit not found' });

    const property = await StorageProperty.findById(unit.propertyId);
    if (!property) return res.recordNotFound({ message: 'Storage property not found' });

    const admin = await User.findById(property.ownerId);
    if (!admin) return res.recordNotFound({ message: 'Admin (owner) not found' });

    const user = await User.findById(userId);
    if (!user) return res.recordNotFound({ message: 'User not found' });

    // Check or create booking
    let booking = await Booking.findOne({ customerId: userId, unitId });

    if (!booking) {
      booking = await Booking.create({
        customerId: userId,
        unitId,
        propertyId: unit.propertyId,
        bookingStatus: BOOKING_STATUS.PENDING,
        documentId: []
      });
    }

    // Create meeting
    const meeting = new Meeting({
      ...req.body,
      bookingId: booking._id,
      meetingStatus: 'meeting-requested'
    });

    await meeting.save();

    await Booking.findByIdAndUpdate(
      booking._id,
      {
        bookingStatus: BOOKING_STATUS.MEETING_REQUESTED,
        meetingId: meeting._id
      }
    );

    // Log activity
    await ActivityLog.create({
      bookingId: booking._id,
      userId: req.user.id,
      action: BOOKING_STATUS.MEETING_REQUESTED
    });

    // Notify attendee
    const organizer = await User.findById(meeting.organizerId);
    const attendee = await User.findById(meeting.attendeeId);

    if (attendee?.email) {
      await sendMeetingRequestEmail(
        attendee.email,
        meeting,
        organizer?.username || 'Organizer',
        attendee.username || 'User'
      );
    }

    return res.success({
      data: meeting,
      message: 'Meeting scheduled successfully and attendee notified.'
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    return res.internalServerError({
      message: 'Failed to create meeting',
      error: error.message
    });
  }
};
