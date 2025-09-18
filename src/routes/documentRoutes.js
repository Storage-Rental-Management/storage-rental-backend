const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const getUploader = require('../middlewares/upload');
const { isAuthenticated } = require('../middlewares/auth');


const upload = getUploader('documents');

// Upload document
router.post('/upload', isAuthenticated, upload.any(), documentController.uploadDocument);

// Review document (admin only)
router.put('/review', isAuthenticated, documentController.reviewDocument);

// Get all documents for a booking
router.get('/:userId/', isAuthenticated, documentController.getBookingDocuments);

// Get single document
router.get('/:id', isAuthenticated, documentController.getDocumentById);

// Update document (e.g., change type or metadata)
router.put('/:id', isAuthenticated, upload.any(), documentController.updateDocument);

// Delete document
router.delete('/:id', isAuthenticated, documentController.deleteDocument);

// Resubmit rejected document
router.post('/:bookingId/resubmit', isAuthenticated, upload.any(), documentController.resubmitDocument);

module.exports = router;
