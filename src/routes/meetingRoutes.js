const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    createMeeting,
    getMeetingById,
    getAllMeetings,
    updateMeeting,
    deleteMeeting,
    confirmMeeting,
    completeMeeting,
    getAvailableSlots,
    getMeetingsCalendarSummary
} = require('../controllers/meetingController');

router.get('/slots', isAuthenticated, getAvailableSlots);
router.get('/', isAuthenticated, getAllMeetings);
router.get('/calendar-summary', isAuthenticated, getMeetingsCalendarSummary);
router.post('/', isAuthenticated, createMeeting);
router.get('/:id', isAuthenticated, getMeetingById);
router.put('/:id', isAuthenticated, updateMeeting);
router.delete('/:id', isAuthenticated, deleteMeeting);
router.post('/:id/status', isAuthenticated, confirmMeeting);
router.post('/:id/complete', isAuthenticated, completeMeeting);

module.exports = router; 