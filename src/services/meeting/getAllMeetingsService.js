const mongoose = require("mongoose");
const Meeting = require("../../models/meeting");
const { ROLES } = require("../../constants/databaseEnums");
const User = require("../../models/user");

module.exports = async (req, res) => {
  try {
    const {
      status,
      organizerId,
      attendeeId,
      search,
      sortBy = "scheduledFor",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Access Control by Role
    const userId = req.user.id;
    const user = await User.findById(userId).populate("role");

    const matchStage = {};

    // Role-based access control
    if (user?.role?.name !== ROLES.SUPER_ADMIN) {
      matchStage.attendeeId = new mongoose.Types.ObjectId(userId);
    }

    if (status) matchStage.meetingStatus = status;
    if (organizerId)
      matchStage.organizerId = new mongoose.Types.ObjectId(organizerId);
    if (attendeeId)
      matchStage.attendeeId = new mongoose.Types.ObjectId(attendeeId);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const pipeline = [{ $match: matchStage }];

    // Populating organizerId
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "organizerId",
          foreignField: "_id",
          as: "organizer",
        },
      },
      { $unwind: { path: "$organizer", preserveNullAndEmptyArrays: true } },

      // Populating attendeeId
      {
        $lookup: {
          from: "users",
          localField: "attendeeId",
          foreignField: "_id",
          as: "attendee",
        },
      },
      { $unwind: { path: "$attendee", preserveNullAndEmptyArrays: true } },

      // Populating unitId
      {
        $lookup: {
          from: "storageunits",
          localField: "unitId",
          foreignField: "_id",
          as: "unit",
        },
      },
      { $unwind: { path: "$unit", preserveNullAndEmptyArrays: true } },

      // Populating bookingId
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking",
        },
      },
      { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } }
    );

    // Search
    if (search) {
      const regex = new RegExp(search, "i");

      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
            { location: { $regex: regex } },
            { meetingType: { $regex: regex } },
            { phone: { $regex: regex } },
            { meetingStatus: { $regex: regex } },
            { "organizer.username": { $regex: regex } },
            { "organizer.email": { $regex: regex } },
            { "attendee.username": { $regex: regex } },
            { "attendee.email": { $regex: regex } },
            { "unit.unitNumber": { $regex: regex } },
            { "booking.bookingStatus": { $regex: regex } },
          ],
        },
      });
    }

    // Total Count
    const countPipeline = [...pipeline, { $count: "total" }];

    // Sorting, Pagination
    pipeline.push({ $sort: sort });
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const [meetings, countResult] = await Promise.all([
      Meeting.aggregate(pipeline),
      Meeting.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.success({
      message: "Meetings fetched successfully",
      data: meetings,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to fetch meetings",
      error: error.message,
    });
  }
};
