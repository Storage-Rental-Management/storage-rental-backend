const createMeetingService = require("../services/meeting/createMeetingService");
const getMeetingByIdService = require("../services/meeting/getMeetingByIdService");
const updateMeetingService = require("../services/meeting/updateMeetingService");
const deleteMeetingService = require("../services/meeting/deleteMeetingService");
const getAllMeetingsService = require("../services/meeting/getAllMeetingsService");
const confirmMeetingService = require("../services/meeting/confirmMeetingService");
const completeMeetingService = require("../services/meeting/completeMeetingService");
const getAvailableSlotsService = require("../services/meeting/getAvailableSlotsService");
const getMeetingsCalendarSummaryService = require("../services/meeting/getMeetingsCalenderSummary");

// Create meeting
const createMeeting = async (req, res) => {
  try {
    await createMeetingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get meeting by ID
const getMeetingById = async (req, res) => {
  try {
    await getMeetingByIdService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get all meetings
const getAllMeetings = async (req, res) => {
  try {
    await getAllMeetingsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Update meeting
const updateMeeting = async (req, res) => {
  try {
    await updateMeetingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    await deleteMeetingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const confirmMeeting = async (req, res) => {
  try {
    await confirmMeetingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const completeMeeting = async (req, res) => {
  try {
    await completeMeetingService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    await getAvailableSlotsService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get Calendar wise meetings for Admin
const getMeetingsCalendarSummary = async (req, res) => {
  try {
    await getMeetingsCalendarSummaryService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetingById,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  confirmMeeting,
  completeMeeting,
  getAvailableSlots,
  getMeetingsCalendarSummary,
};
