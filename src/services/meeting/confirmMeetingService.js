const Meeting = require("../../models/meeting");
const User = require("../../models/user");
const Booking = require("../../models/booking");
const Notification = require("../../models/notification");
const {
  sendMeetingConfirmationEmail,
  sendMeetingDeclinedEmail,
} = require("../../resources/emailUtils");
const { BOOKING_STATUS } = require("../../constants/databaseEnums");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const StorageUnit = require('../../models/storageUnit');

const { v4: uuidv4 } = require("uuid");

module.exports = async (req, res) => {
  try {
    const { notificationId, meetLink } = req.body;

    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({
          message: "This action has already been completed.",
        });
      }
    }

    if (req.user.role !== "Admin") {
      return res.unAuthorized({
        message: "Only admin can confirm or decline meetings.",
      });
    }

    const { meetingStatus } = req.body;
    if (!["meeting-confirmed", "meeting-rejected"].includes(meetingStatus)) {
      return res.validationError({
        message: "Status must be meeting-confirmed or meeting-rejected.",
      });
    }

    const meetingToUpdate = await Meeting.findById(req.params.id);
    if (!meetingToUpdate) {
      return res.recordNotFound({ message: "Meeting not found" });
    }

    const update = { meetingStatus };
    if (
      meetingStatus === "meeting-confirmed" &&
      meetingToUpdate.meetingType === "google-meet"
    ) {
      update.meetLink = meetLink;
      // || `https://meet.google.com/${uuidv4()}`;
    }

    const meeting = await Meeting.findByIdAndUpdate(req.params.id, update, {
      new: true,
    })
      .populate("attendeeId", "email username")
      .populate("organizerId", "email username");

    if (!meeting) return res.recordNotFound({ message: "Meeting not found" });

    // --- Sync booking status ---
    const statusMap = {
      "meeting-confirmed": BOOKING_STATUS.MEETING_CONFIRMED,
      "meeting-rejected": BOOKING_STATUS.MEETING_REJECTED,
    };
    const newBookingStatus = statusMap[meetingStatus];
    if (meeting.bookingId && newBookingStatus) {
      await Booking.findByIdAndUpdate(meeting.bookingId, {
        bookingStatus: newBookingStatus,
      });
    }

    const attendee = await User.findById(meeting.attendeeId);
    const organizer = await User.findById(meeting.organizerId);

    // Fetch unit name for context
    let unitName = '';
    try {
      const unit = await StorageUnit.findById(meeting.unitId);
      if (unit && unit.name) unitName = unit.name;
    } catch (e) {}
    const meetingTime = meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : '';
    // Notify attendee
    if (meetingStatus === "meeting-confirmed") {
      if (organizer?.email) {
        await sendMeetingConfirmationEmail(organizer.email, meeting);

        const notificationMetadata = {
          meetingId: meeting._id,
          unitId: meeting.unitId,
        };
        let message = `Hi ${organizer.username || 'User'}, your meeting ${unitName ? ' for unit "' + unitName + '"' : ''}${meetingTime ? ' on ' + meetingTime : ''} has been confirmed.`;

        if (meeting.meetingType === "google-meet" && meeting.meetLink) {
          notificationMetadata.meetLink = meeting.meetLink;
          message = `Hi ${organizer.username || 'User'}, your Google Meet meeting${unitName ? ' for unit "' + unitName + '"' : ''}${meetingTime ? ' on ' + meetingTime : ''} is confirmed! Please check the meeting link and be ready at the scheduled time. Looking forward to a productive session!`;
        } else {
          message = `Hi ${organizer.username || 'User'}, your meeting${unitName ? ' for unit "' + unitName + '"' : ''}${meetingTime ? ' on ' + meetingTime : ''} is confirmed! We look forward to your participation.`;
        }

        await sendNotification({
          recipientId: organizer._id,
          title: "Meeting Confirmed!",
          message,
          group: "Meeting",
          type: NOTIFICATION_TYPE.MEETING_CONFIRMED,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: notificationMetadata,
          isAction: false,
        });
      }
    } else {
      // meeting-rejected
      if (meeting.attendeeId && meeting.scheduledFor) {
        await User.findByIdAndUpdate(meeting.attendeeId, {
          $pull: { bookedSlots: new Date(meeting.scheduledFor) },
        });
      }

      if (organizer?.email) {
        await sendMeetingDeclinedEmail(
          organizer.email,
          meeting,
          organizer.username
        );
        await sendNotification({
          recipientId: organizer._id,
          title: "Meeting Declined",
          message: `Hi ${organizer.username || 'User'}, unfortunately the meeting with ${attendee.username || 'the attendee'}${unitName ? ' for unit "' + unitName + '"' : ''} was declined. If you have questions or want to reschedule, please contact support or try again!`,
          group: "Meeting",
          type: NOTIFICATION_TYPE.MEETING_REJECTED,
          priority: NOTIFICATION_PRIORITY.MEDIUM,
          metadata: {
            meetingId: meeting._id,
            attendeeId: attendee._id,
            unitId: meeting.unitId,
          },
          isAction: false,
        });
      }
    }

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        isActionCompleted: true,
        actionCompletedAt: new Date(),
      });
    }

    return res.success({
      data: meeting,
      message: `Meeting ${meetingStatus} and attendee notified.`,
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
