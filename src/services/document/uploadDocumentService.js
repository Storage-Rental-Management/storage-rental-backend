const Documents = require("../../models/document");
const Booking = require("../../models/booking");
const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const User = require("../../models/user");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  BOOKING_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
} = require("../../constants/databaseEnums");
const {
  sendDocumentReviewRequestEmail,
} = require("../../resources/emailUtils");

module.exports = async (req, res) => {
  try {
    const { unitId, bookingId } = req.body;
    const userId = req.user.id;

    // 🛡️ Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.validationError({ message: "No documents uploaded" });
    }

    // 🧱 Validate and fetch data
    const unit = await StorageUnit.findById(unitId);
    if (!unit) return res.recordNotFound({ message: "Storage unit not found" });

    const property = await StorageProperty.findById(unit.propertyId);
    if (!property)
      return res.recordNotFound({ message: "Storage property not found" });

    const admin = await User.findById(property.ownerId);
    if (!admin) return res.recordNotFound({ message: "Admin not found" });

    const user = await User.findById(userId);
    if (!user) return res.recordNotFound({ message: "User not found" });

    const documentMap = {};
    const allowedTypes = Object.values(DOCUMENT_TYPES);

    for (const file of req.files) {
      const match = file.fieldname.match(/^documents\[(.+)\]$/);
      if (!match) continue;

      const type = match[1];

      // Check for invalid document types
      if (!allowedTypes.includes(type)) {
        return res.validationError({
          message: `Invalid document type: ${type}`,
        });
      }

      const url = `/uploads/documents/${file.filename}`;
      if (!documentMap[type]) documentMap[type] = [];
      documentMap[type].push(url);
    }

    // 🧾 Check if all required documents are uploaded
    const uploadedTypes = Object.keys(documentMap);
    const requiredDocs = Array.isArray(unit.requiredDocuments)
      ? unit.requiredDocuments
      : [];
    const missingRequiredDocs = requiredDocs.filter(
      (type) => !uploadedTypes.includes(type)
    );

    if (missingRequiredDocs.length) {
      return res.validationError({
        message: `Missing required documents: ${missingRequiredDocs.join(
          ", "
        )}`,
      });
    }

    // 🧾 Find or create booking
    let booking = bookingId
      ? await Booking.findOne({ _id: bookingId, customerId: userId, unitId })
      : await Booking.findOne({ customerId: userId, unitId });

    if (!booking) {
      booking = await Booking.create({
        customerId: userId,
        unitId,
        propertyId: unit.propertyId,
        bookingStatus: BOOKING_STATUS.BOOKING_INITIATED,
        documentId: [],
      });
    }

    // 💾 Save documents
    const savedDocument = await Documents.create({
      userId,
      unitId,
      documentType: uploadedTypes,
      documents: documentMap,
      submittedAt: new Date(),
      status: DOCUMENT_STATUS.DOCUMENTS_UPLOADED,
    });

    const documentIds = [savedDocument._id];

    // 🔄 Update booking
    await Booking.findByIdAndUpdate(
      booking._id,
      {
        $push: { documentId: { $each: documentIds } },
        bookingStatus: BOOKING_STATUS.DOCUMENTS_UPLOADED,
      },
      { new: true }
    );

    // 📧 Notify admin - Use join() only for display purposes
    await sendDocumentReviewRequestEmail(admin.email, {
      userName: user.username,
      documentType: uploadedTypes.join(", "), 
      submittedDate: new Date().toLocaleDateString(),
      bookingId: booking._id,
    });

    const unitName = unit?.name ? ` for unit "${unit.name}"` : "";
    await sendNotification({
      recipientId: admin._id,
      title: "Document Uploaded",
      message: `Hi ${admin.username || "Admin"}, ${
        user.username
      } has uploaded all required documents (${uploadedTypes.join(
        ", "
      )}) ${unitName} for booking ID (${
        booking._id
      }). Please review them at your convenience. Thank you!`,
      group: "Booking",
      type: NOTIFICATION_TYPE.DOCUMENTS_UPLOADED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        bookingId: booking._id,
        userId: user._id,
        actionButtons: ["approve", "reject"],
        actionUserId: admin._id,
        documentIds,
        documentId: documentIds[0],
        unitId: unit._id,
        documentsInfo: Object.entries(savedDocument.documents).flatMap(
          ([type, urls]) =>
            urls.map((url) => ({
              id: savedDocument._id,
              type,
              url,
              status: savedDocument.status,
            }))
        ),
      },
      isAction: true,
      isActionCompleted: false,
    });

    // ✅ Notify user
    await sendNotification({
      recipientId: user._id,
      title: "Documents Uploaded Successfully!",
      message: `Great job, ${
        user.username || "User"
      }! Your documents (${uploadedTypes.join(
        ", "
      )})${unitName} for booking ID (${
        booking._id
      }) have been uploaded and are now under review. We’ll notify you once they’ve been checked.`,
      group: "Document",
      type: NOTIFICATION_TYPE.DOCUMENTS_UPLOADED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        bookingId: booking._id,
        documentIds,
        documentId: documentIds[0],
        unitId: unit._id,
      },
      isAction: false,
    });

    return res.success({
      message: "All required documents uploaded successfully",
      data: savedDocument,
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
