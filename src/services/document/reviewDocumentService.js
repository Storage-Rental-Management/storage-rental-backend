const fs = require('fs');
const path = require('path');
const Documents = require('../../models/document');
const Booking = require('../../models/booking');
const User = require('../../models/user');
const StorageUnit = require('../../models/storageUnit');
const Notification = require('../../models/notification'); 
const { sendDocumentStatusUpdateEmail } = require('../../resources/emailUtils');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');
const { sendNotification } = require('../../resources/notification');
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../constants/notificationEnums');

module.exports = async (req, res) => {
  try {
    const { bookingId, updates, notificationId } = req.body;
    const reviewedBy = req.user.id;

    if (!bookingId || !updates || !Array.isArray(updates) || updates.length === 0) {
      return res.badRequest({ message: 'Invalid request data. BookingId and updates are required.' });
    }

    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({ message: 'This action has already been completed.' });
      }
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.recordNotFound({ message: 'Booking not found' });
    }
    if (!booking.customerId) {
      return res.badRequest({ message: 'Invalid booking: no customer ID found' });
    }

    const updatedDocs = [];
    const resubmissionDocs = [];

    for (const { documentId, status, comments, documentType } of updates) {
      const doc = await Documents.findById(documentId);
      if (!doc) continue;

      if (status === 'documents-resubmission-required' && documentType && doc.documents?.[documentType]) {
        const urls = doc.documents[documentType];
        for (const url of urls) {
          const filePath = path.join(__dirname, '../../', url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        delete doc.documents[documentType];
      }

      doc.status = status;
      doc.comments = comments;
      doc.reviewedAt = new Date();
      doc.reviewedBy = reviewedBy;
      await doc.save();

      updatedDocs.push(doc);
      if (status === 'documents-resubmission-required') {
        resubmissionDocs.push({ ...doc.toObject(), documentType });
      }
    }

    const documentIds = Array.isArray(booking.documentId) ? booking.documentId : [booking.documentId];
    const validDocumentIds = documentIds.filter(id => id != null);
    const allDocs = await Documents.find({ _id: { $in: validDocumentIds } });
    const allStatuses = allDocs.map(d => d.status);

    let bookingStatus;
    if (allStatuses.includes('documents-resubmission-required')) {
      bookingStatus = BOOKING_STATUS.DOCUMENTS_RESUBMISSION_REQUIRED;
    } else if (allStatuses.every(s => s === 'documents-approved')) {
      bookingStatus = BOOKING_STATUS.DOCUMENTS_APPROVED;
    } else if (allStatuses.includes('documents-pending-review')) {
      bookingStatus = BOOKING_STATUS.DOCUMENTS_UNDER_REVIEW;
    } else {
      bookingStatus = BOOKING_STATUS.DOCUMENTS_UPLOADED;
    }

    await Booking.findByIdAndUpdate(bookingId, { bookingStatus });

    if (bookingStatus === BOOKING_STATUS.DOCUMENTS_APPROVED && booking.unitId) {
      try {
        await StorageUnit.findByIdAndUpdate(booking.unitId, {
          status: 'reserved',
          isAvailable: false,
          updatedAt: new Date()
        });
      } catch (unitUpdateError) {
        console.error('Failed to update storage unit status:', unitUpdateError.message);
      }
    }

    const user = await User.findById(booking.customerId);
    if (!user) {
      return res.badRequest({ message: 'User not found for this booking' });
    }

    const unit = booking.unitId ? await StorageUnit.findById(booking.unitId) : null;
    const unitName = unit?.name ? ` for unit "${unit.name}"` : '';

    if (resubmissionDocs.length > 0) {
      try {
        await sendDocumentStatusUpdateEmail(user.email, {
          userName: user.username,
          reviewDate: new Date().toLocaleDateString(),
          documents: resubmissionDocs.map(doc => ({
            type: doc.documentType,
            comments: doc.comments || 'Please resubmit this document.'
          }))
        });
      } catch (emailError) {
        console.error('Resubmission email failed:', emailError.message);
      }

      try {
        await sendNotification({
          recipientId: user._id,
          title: 'Document Resubmission Required',
          message: `Hi ${user.username || 'User'}, some of your documents${unitName} for booking ID (${booking._id}) need a little more attention. Please check the comments and upload the required documents again so we can continue processing your booking. If you need help, feel free to reach out!`,
          group: 'Document',
          type: NOTIFICATION_TYPE.DOCUMENTS_RESUBMISSION_REQUIRED,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: {
            bookingId,
            unitId: booking.unitId,
            documentsToResubmit: resubmissionDocs.map(doc => ({
              id: doc._id,
              type: doc.documentType,
              comments: doc.comments || 'No comments provided.'
            })),
            actionButtons: ['resubmit_documents'],
            actionUserId: user._id,
            documentIds: resubmissionDocs.map(doc => doc._id),
            documentId: resubmissionDocs[0]?._id,
          },
          isAction: true,
          isActionCompleted: false
        });
      } catch (notificationError) {
        console.error('Resubmission notification failed:', notificationError.message);
      }

    } else if (bookingStatus === BOOKING_STATUS.DOCUMENTS_APPROVED) {
      try {
        await sendNotification({
          recipientId: user._id,
          title: 'Documents Approved!',
          message: `Awesome news, ${user.username || 'User'}! Your documents${unitName} for booking ID (${booking._id}) have been approved. You can now proceed to payment and secure your booking.`,
          group: 'Document',
          type: NOTIFICATION_TYPE.DOCUMENTS_VERIFIED,
          priority: NOTIFICATION_PRIORITY.HIGH,
          metadata: {
            bookingId,
            unitId: booking.unitId,
            actionButtons: ['proceed_to_payment'],
            actionUserId: user._id,
            documentIds: validDocumentIds,
            documentId: validDocumentIds[0],
            yearlyCharge: unit?.yearlyCharge,
            yearlyDiscount: unit?.yearlyCharge,
            monthlyCharge: unit?.yearlyCharge,
            monthlyDiscount: unit?.yearlyCharge,
          },
          isAction: true,
          isActionCompleted: false
        });

        payment_reminder =await sendNotification({
          recipientId: reviewedBy,
          title: 'User Notified for Payment',
          message: `You’ve just notified ${user.username} to proceed with payment for booking ID (${booking._id})${unitName}. Thank you for helping our users move forward!`,
          group: 'Document',
          type: NOTIFICATION_TYPE.BOOKING_ACTION,
          priority: NOTIFICATION_PRIORITY.LOW,
          metadata: {
            bookingId,
            userId: user._id,
            unitId: booking.unitId,
            actionButtons: ['notify_for_payment', 'booking_cancel'],
            actionUserId: reviewedBy,
            documentIds: validDocumentIds,
            documentId: validDocumentIds[0],
            yearlyCharge: unit?.yearlyCharge,
            yearlyDiscount: unit?.yearlyCharge,
            monthlyCharge: unit?.yearlyCharge,
            monthlyDiscount: unit?.yearlyCharge,
          },
          isAction: true,
          isActionCompleted: false
        });
      } catch (notificationError) {
        console.error('Approval notification failed:', notificationError.message);
      }
    }

    if (notificationId) {
      try {
        await Notification.findByIdAndUpdate(notificationId, {
          isActionCompleted: true,
          actionCompletedAt: new Date()
        });
      } catch (updateError) {
        console.error('Failed to mark notification completed:', updateError.message);
      }
    }

    return res.success({
      message: 'Documents reviewed successfully',
      data: updatedDocs
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
