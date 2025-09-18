const uploadDocumentService = require('../services/document/uploadDocumentService');
const getBookingDocumentsService = require('../services/document/getAllDocumentsService');
const getDocumentByIdService = require('../services/document/getDocumentByIdService');
const updateDocumentService = require('../services/document/updateDocumentService');
const reviewDocumentService = require('../services/document/reviewDocumentService');
const deleteDocumentService = require('../services/document/deleteDocumentService');
const resubmitDocumentService = require('../services/document/resubmitDocumentService');

// Upload document
const uploadDocument = async (req, res) => {
    try {
        await uploadDocumentService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get documents by userId
const getBookingDocuments = async (req, res) => {
    try {
        await getBookingDocumentsService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Get document by ID
const getDocumentById = async (req, res) => {
    console.log("getDocumentById called with params:", req.params);
    try {
        await getDocumentByIdService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Update document
const updateDocument = async (req, res) => {
    try {
        await updateDocumentService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Review document
const reviewDocument = async (req, res) => {
    try {
        await reviewDocumentService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Delete document
const deleteDocument = async (req, res) => {
    try {
        await deleteDocumentService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

// Resubmit rejected document
const resubmitDocument = async (req, res) => {
    try {
        await resubmitDocumentService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
};

module.exports = {
    uploadDocument,
    getBookingDocuments,
    getDocumentById,
    updateDocument,
    reviewDocument,
    deleteDocument,
    resubmitDocument
};
