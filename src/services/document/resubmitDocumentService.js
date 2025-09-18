const Documents = require("../../models/document");
const Booking = require("../../models/booking");
const StorageProperty = require("../../models/storageProperty");
const User = require("../../models/user");
const {
  sendDocumentResubmissionRequestEmail,
} = require("../../resources/emailUtils");
const { BOOKING_STATUS } = require("../../constants/databaseEnums");
const { sendNotification } = require("../../resources/notification");
const Notification = require("../../models/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const StorageUnit = require("../../models/storageUnit");
const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notificationId } = req.body;
    const userId = req.user.id;

    if (notificationId) {
      const notification = await Notification.findById(notificationId);
      if (notification?.isActionCompleted) {
        return res.badRequest({
          message: "This action has already been completed.",
        });
      }
    }

    if (!req.files || req.files.length === 0 || !req.body.documentTypes) {
      return res.validationError({
        message: "No documents or document types provided for resubmission",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customerId: userId,
    });
    if (!booking)
      return res.recordNotFound({ message: "Booking not found for this user" });

    const unit = await StorageUnit.findById(booking.unitId);
    if (!unit) return res.recordNotFound({ message: "Storage unit not found" });

    const requiredDocs = Array.isArray(unit.requiredDocuments)
      ? unit.requiredDocuments
      : [];

    const documentMap = {};
    for (const file of req.files) {
      const match = file.fieldname.match(/^documents\[(.+)\]$/);
      if (!match) continue;
      const type = match[1];
      if (!documentMap[type]) documentMap[type] = [];
      documentMap[type].push(file);
    }

    const uploadedTypes = Object.keys(documentMap);
    const invalidTypes = uploadedTypes.filter((t) => !requiredDocs.includes(t));
    if (invalidTypes.length > 0) {
      return res.validationError({
        message: `Uploaded invalid document types: ${invalidTypes.join(", ")}`,
      });
    }

    const missingTypes = requiredDocs.filter(
      (type) => !uploadedTypes.includes(type)
    );
    if (missingTypes.length > 0) {
      return res.validationError({
        message: `Missing required documents: ${missingTypes.join(", ")}`,
      });
    }

    const documentsToResubmit = await Documents.find({
      _id: { $in: booking.documentId },
      status: {
        $in: [
          "documents-rejected",
          "documents-resubmission-required",
          "documents-uploaded",
          "documents-approved",
        ],
      },
    });

    const property = await StorageProperty.findById(booking.propertyId);
    if (!property)
      return res.recordNotFound({ message: "Storage property not found" });

    const admin = await User.findById(property.ownerId);
    if (!admin) return res.recordNotFound({ message: "Admin not found" });

    const user = await User.findById(userId);
    if (!user) return res.recordNotFound({ message: "User not found" });

    const updatedDocsMap = new Map();
    const resubmittedTypes = [];

    for (const type of uploadedTypes) {
      const files = documentMap[type];
      const doc = documentsToResubmit.find((d) => d.documents[type]);
      if (!doc) {
        return res.validationError({
          message: `No existing document found for type: ${type}`,
        });
      }

      // Remove old files
      if (doc.documents[type] && Array.isArray(doc.documents[type])) {
        for (const url of doc.documents[type]) {
          const filePath = path.join(__dirname, "../../", url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }

      doc.documents[type] = files.map(
        (f) => `/uploads/documents/${f.filename}`
      );
      doc.status = "documents-resubmitted";
      doc.submittedAt = new Date();
      doc.comments = null;
      doc.reviewedAt = null;
      doc.reviewedBy = null;
      await doc.save();

      updatedDocsMap.set(doc._id.toString(), doc);
      resubmittedTypes.push(type);
    }

    // Email to admin
    await sendDocumentResubmissionRequestEmail(admin.email, {
      userName: user.username,
      documentType: resubmittedTypes.join(", "),
      resubmittedDate: new Date().toLocaleDateString(),
      bookingId: booking._id,
      previousStatus: "documents-resubmitted",
    });

    let unitName = "";
    if (booking.unitId) {
      try {
        const unit = await StorageUnit.findById(booking.unitId);
        if (unit && unit.name) unitName = ` for unit \"${unit.name}\"`;
      } catch (e) {
        /* ignore */
      }
    }
    await sendNotification({
      recipientId: admin._id,
      title: "Document Resubmitted",
      message: `Hi ${admin.username || "Admin"}, ${
        user.username
      } has just resubmitted the documents: ${resubmittedTypes.join(
        ", "
      )}${unitName} for booking ID (${
        booking._id
      }). Please review it at your earliest convenience. Thank you for your attention!`,
      group: "Booking",
      type: NOTIFICATION_TYPE.DOCUMENTS_RESUBMITTED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        bookingId: booking._id,
        userId: user._id,
        documentId: Array.from(updatedDocsMap.keys()), 
        unitId: booking.unitId,
        actionButtons: ["approve", "reject"],
        actionUserId: admin._id,
        documentsInfo: Array.from(updatedDocsMap.values()).flatMap((doc) =>
          Object.entries(doc.documents).flatMap(([docType, urls]) =>
            urls.map((url) => ({
              id: doc._id,
              type: docType,
              url,
              status: doc.status,
            }))
          )
        ),
      },
      isAction: true,
      isActionCompleted: false,
    });

    // Single notification to user
    await sendNotification({
      recipientId: user._id,
      title: "Documents Resubmitted!",
      message: `Well done, ${
        user.username || "User"
      }! You have successfully resubmitted the documents: ${resubmittedTypes.join(
        ", "
      )}${unitName} for booking ID (${
        booking._id
      }). It’s now under review. We’ll keep you posted on the next steps!`,
      group: "Booking",
      type: NOTIFICATION_TYPE.DOCUMENTS_RESUBMITTED,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: {
        bookingId: booking._id,
        unitId: booking.unitId,
      },
      isAction: false,
    });

    // Update booking status
    if (updatedDocsMap.size > 0) {
      await Booking.findByIdAndUpdate(booking._id, {
        bookingStatus: BOOKING_STATUS.DOCUMENTS_RESUBMITTED,
      });
    }

    // Mark notification as completed
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        isActionCompleted: true,
        actionCompletedAt: new Date(),
      });
    }

    return res.success({
      message: "Documents resubmitted successfully",
      data: Array.from(updatedDocsMap.values()),
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
