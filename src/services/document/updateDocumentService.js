const Documents = require('../../models/document'); 
const Booking = require('../../models/booking');
const { BOOKING_STATUS } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the document before update
    const oldDocument = await Documents.findById(id);
    if (!oldDocument) {
      return res.recordNotFound({ message: 'Document not found' });
    }

    const updated = await Documents.findByIdAndUpdate(id, req.body, { new: true });

    // Find the booking that contains this document
    const bookings = await Booking.find({});
    let booking = null;

    for (const b of bookings) {
      if (b.documentId.map(String).includes(String(id))) {
        booking = b;
        break;
      }
    }

    if (booking) {
      // If status is being updated, update booking status
      if (req.body.status && req.body.status !== oldDocument.status) {
        let bookingStatus;
        switch (req.body.status) {
          case 'documents-approved':
            bookingStatus = BOOKING_STATUS.DOCUMENTS_APPROVED;
            break;
          case 'documents-rejected':
            bookingStatus = BOOKING_STATUS.DOCUMENTS_REJECTED;
            break;
          case 'documents-resubmission-required':
            bookingStatus = BOOKING_STATUS.DOCUMENTS_RESUBMISSION_REQUIRED;
            break;
          default:
            bookingStatus = req.body.status;
        }

        // Update booking status
        await Booking.findByIdAndUpdate(
          booking._id,
          { bookingStatus }
        );
      }
    }

    return res.success({ message: 'Document updated successfully', data: updated });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};