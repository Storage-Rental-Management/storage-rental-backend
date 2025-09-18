const { StorageUnit, StorageProperty } = require("../../models");
const Booking = require("../../models/booking");
const Meeting = require("../../models/meeting");
const Documents = require("../../models/document");
const { STORAGE_UNIT_STATUS } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await StorageUnit.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updated)
      return res.recordNotFound({ message: "Storage unit not found" });

    let update = { $inc: { unitCount: -1 } };
    if (updated.status === STORAGE_UNIT_STATUS.OCCUPIED) {
      update.$inc.activeCount = -1;
    }

    // Hard delete all bookings, meetings, and documents for this unit
    await StorageProperty.findByIdAndUpdate(updated.propertyId, update, {
      new: true,
    });
    await Booking.deleteMany({ unitId: id });
    await Meeting.deleteMany({ unitId: id });
    await Documents.deleteMany({ unitId: id });

    return res.success({
      message:
        "Storage unit and all related bookings, meetings, and documents deleted.",
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to delete storage unit and related data",
      data: { errors: error.message },
    });
  }
};
