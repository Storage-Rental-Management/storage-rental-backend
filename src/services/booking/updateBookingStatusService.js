const Booking = require("../../models/booking");
const StorageUnit = require("../../models/storageUnit");
const Joi = require("joi");
const {
  BOOKING_STATUS,
  STORAGE_UNIT_STATUS,
} = require("../../constants/databaseEnums");
const storageProperty = require("../../models/storageProperty");

const statusSchema = Joi.object({
  bookingStatus: Joi.string()
    .valid(...Object.values(BOOKING_STATUS))
    .required(),
  description: Joi.string().allow("", null),
});

module.exports = async (req, res) => {
  try {
    const { error } = statusSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const bookingDetails = await Booking.findById(req.params.id).populate(
      "unitId"
    );

    if (!bookingDetails)
      return res.recordNotFound({ message: "Booking not found" });

    const unit = bookingDetails.unitId;
    if (
      req.body.bookingStatus === BOOKING_STATUS.BOOKING_CANCELLED ||
      req.body.bookingStatus === BOOKING_STATUS.BOOKING_EXPIRED
    ) {
      if (unit) {
        let unitUpdate = {
          status: STORAGE_UNIT_STATUS.AVAILABLE,
          isAvailable: true,
          updatedAt: new Date(),
        };

        await StorageUnit.findByIdAndUpdate(unit._id, unitUpdate);
        await Booking.findByIdAndUpdate(req.params.id, { endDate: new Date() });

        // 🏠 Handle activeCount only if unit was occupied
        if (unit.status === STORAGE_UNIT_STATUS.OCCUPIED) {
          await storageProperty.findByIdAndUpdate(
            bookingDetails.propertyId?._id || bookingDetails.propertyId,
            { $inc: { activeCount: -1 } },
            { new: true }
          );
        }
      }
    }

    bookingDetails.bookingStatus = req.body.bookingStatus;
    if (req.body.description) {
      bookingDetails.description = req.body.description;
    }
    await bookingDetails.save();

    return res.success({
      data: bookingDetails,
      message: "Booking status updated successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
