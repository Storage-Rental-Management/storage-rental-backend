const mongoose = require("mongoose");
const { ROLES } = require("../../constants/databaseEnums");
const Meeting = require("../../models/meeting");
const User = require("../../models/user");

module.exports = async (req, res) => {
  try {
    const {
      unitId,
      organizerId,
      attendeeId,
      meetingType,
      meetingStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Access Control by Role
    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const match = { isDeleted: false };

    // Role-based access control
    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      match.attendeeId = new mongoose.Types.ObjectId(userId);
    }

    // Optional filters
    if (unitId) match.unitId = unitId;
    if (organizerId) match.organizerId = organizerId;
    if (attendeeId) match.attendeeId = attendeeId;
    if (meetingType) match.meetingType = meetingType;
    if (meetingStatus) match.meetingStatus = meetingStatus;

    // Date filtering logic
    if (startDate && !endDate) {
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      match.scheduledFor = { $gte: start, $lte: end };
    } else if (startDate && endDate && startDate === endDate) {
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      match.scheduledFor = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      match.scheduledFor = {};
      if (startDate) match.scheduledFor.$gte = new Date(startDate);
      if (endDate) match.scheduledFor.$lte = new Date(endDate);
    }

    const totalResult = await Meeting.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$scheduledFor" },
          },
        },
      },
      { $count: "total" },
    ]);

    const total = totalResult[0]?.total || 0;
    // Group by date
    const meetings = await Meeting.aggregate([
      { $match: match },

      // Populate unitId (StorageUnit)
      {
        $lookup: {
          from: "storageunits",
          localField: "unitId",
          foreignField: "_id",
          as: "unit",
        },
      },
      { $unwind: { path: "$unit", preserveNullAndEmptyArrays: true } },

      // Populate organizerId (User)
      {
        $lookup: {
          from: "users",
          localField: "organizerId",
          foreignField: "_id",
          as: "organizer",
        },
      },
      { $unwind: { path: "$organizer", preserveNullAndEmptyArrays: true } },

      // Group by date
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$scheduledFor" },
          },
          meetingCount: { $sum: 1 },
          meetings: {
            $push: {
              meetingId: "$_id",
              title: "$title",
              description: "$description",
              meetingType: "$meetingType",
              status: "$meetingStatus",
              scheduledFor: "$scheduledFor",
              organizerId: "$organizerId",
              organizerName: "$organizer.username",
              unitId: "$unitId",
              unitName: "$unit.name",
              location: "$location",
              phone: "$phone",
              meetLink: "$meetLink",
            },
          },
        },
      },

      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      { $sort: { createdAt: -1 } },
    ]);

    // Format result
    const formatted = meetings.map((item) => ({
      date: item._id,
      meetingCount: item.meetingCount,
      meetings: item.meetings,
    }));

    return res.success({
      message: "Meeting calendar summary fetched successfully",
      data: formatted,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch meeting calendar summary",
      error: error.message,
    });
  }
};
