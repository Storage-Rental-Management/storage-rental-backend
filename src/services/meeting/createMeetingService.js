const Meeting = require("../../models/meeting");
const User = require("../../models/user");
const Booking = require("../../models/booking");
const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const { createMeetingSchema } = require("../../validation/meetingValidation");
const { sendMeetingRequestEmail } = require("../../resources/emailUtils");
const {
  BOOKING_STATUS,
  MEETING_TYPES,
} = require("../../constants/databaseEnums");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");

module.exports = async (req, res) => {
  try {
    const { error, value } = createMeetingSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const { unitId, scheduledFor, meetingType, phone, description } = value;
    const userId = req.user.id; // Organizer

    const unit = await StorageUnit.findById(unitId);
    if (!unit)
      return res.recordNotFound({ message: "Storage unit not found." });

    const property = await StorageProperty.findById(unit.propertyId);
    if (!property)
      return res.recordNotFound({ message: "Storage property not found" });

    const attendee = await User.findById(property.ownerId);
    if (!attendee)
      return res.recordNotFound({ message: "Admin (owner) not found" });

    const organizer = await User.findById(userId);
    if (!organizer) return res.recordNotFound({ message: "User not found" });

    // Check for slot availability
    const participants = [organizer._id, attendee._id];
    const existingMeeting = await Meeting.findOne({
      scheduledFor: new Date(scheduledFor),
      meetingStatus: { $nin: ["meeting-rejected", "meeting-cancelled"] },
      $or: [
        { organizerId: { $in: participants } },
        { attendeeId: { $in: participants } },
      ],
    });

    if (existingMeeting) {
      return res.badRequest({
        message:
          "This time slot is already booked. Please choose another slot.",
      });
    }

    let booking = await Booking.findOne({ customerId: userId, unitId });
    if (!booking) {
      booking = await Booking.create({
        customerId: userId,
        unitId,
        propertyId: unit.propertyId,
        bookingStatus: BOOKING_STATUS.MEETING_REQUESTED,
        documentId: [],
      });
    }

    // --- Prepare meeting data
    const meetingData = {
      unitId,
      bookingId: booking._id,
      organizerId: organizer._id,
      attendeeId: attendee._id,
      meetingType,
      scheduledFor,
      description,
    };

    if (meetingType === MEETING_TYPES.WHATSAPP_CALL) {
      meetingData.phone = phone || organizer.phone;
      if (!meetingData.phone) {
        return res.badRequest({
          message:
            "WhatsApp call requires a phone number, and the user does not have one saved.",
        });
      }
    }

    // --- Create meeting
    const meeting = await Meeting.create(meetingData);

    // Update the booking with the meetingId
    await Booking.findByIdAndUpdate(booking._id, { meetingId: meeting._id });

    await User.findByIdAndUpdate(attendee._id, {
      $addToSet: { bookedSlots: new Date(scheduledFor) },
    });

    if (attendee?.email) {
      await sendMeetingRequestEmail(
        attendee.email,
        meeting,
        organizer?.username || "Organizer",
        attendee.username || "Admin"
      );
    }

    const unitName = unit?.name ? ` for unit "${unit.name}"` : '';
    const meetingTime = meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : '';

    if (attendee) {
      const notificationMetadata = {
        meetingId: meeting._id,
        bookingId: booking._id,
        organizerId: organizer?._id,
        actionButtons: ["confirm", "reject"],
        actionUserId: attendee._id,
        unitId: meeting.unitId,
        meetingType: meeting.meetingType,
      };

      if (meeting.meetingType === "whatsApp-call" && meeting.phone) {
        notificationMetadata.phone = meeting.phone;
      }

      await sendNotification({
        recipientId: attendee._id,
        title: `New Meeting Request (${meeting.meetingType})`,
        message: `Hello ${attendee.username || 'Admin'}, you have a new meeting request from ${organizer?.username || 'the user'}${unitName}${meetingTime ? ' scheduled for ' + meetingTime : ''}. Please review and respond at your convenience. Thank you!`,
        group: "Meeting",
        type: NOTIFICATION_TYPE.MEETING_REQUESTED,
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: notificationMetadata,
        isAction: true,
        isActionCompleted: false,
      });
    }

    if (organizer) {
      await sendNotification({
        recipientId: organizer._id,
        title: "Meeting Request Sent!",
        message: `Great! Your meeting request to ${attendee?.username || 'the admin'}${unitName}${meetingTime ? ' scheduled for ' + meetingTime : ''} has been sent successfully. We’ll notify you once they respond!`,
        group: "Meeting",
        type: NOTIFICATION_TYPE.MEETING_REQUESTED,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        metadata: {
          meetingId: meeting._id,
          bookingId: booking._id,
          attendeeId: attendee?._id,
          unitId: meeting.unitId,
        },
        isAction: false,
      });
    }

    return res.success({
      message: "Meeting created and notifications sent successfully.",
      data: meeting,
    });
  } catch (error) {
    console.log("Failed to create meeting", error);
    return res.internalServerError({
      message: "Failed to create meeting",
      error: error.message,
    });
  }
};
