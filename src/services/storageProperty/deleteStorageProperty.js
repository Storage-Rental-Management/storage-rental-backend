const StorageProperty = require('../../models/storageProperty');
const StorageUnit = require('../../models/storageUnit');
const Booking = require('../../models/booking');
const Meeting = require('../../models/meeting');
const Documents = require('../../models/document');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await StorageProperty.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!updated) {
            return res.recordNotFound({ message: 'Property not found' });
        }

        // Find all units under this property
        const units = await StorageUnit.find({ propertyId: id });

        for (const unit of units) {
            // Soft delete the unit
            await StorageUnit.findByIdAndUpdate(unit._id, { isDeleted: true });

            // Hard delete all bookings for this unit
            await Booking.deleteMany({ unitId: unit._id });

            // Hard delete all meetings for this unit
            await Meeting.deleteMany({ unitId: unit._id });

            // Hard delete all documents for this unit
            await Documents.deleteMany({ unitId: unit._id });
        }

        return res.success({ message: 'Property and all related units, bookings, meetings, and documents deleted.' });
    } catch (error) {
        return res.internalServerError({
            message: 'Failed to delete storage property and related data',
            data: { errors: error.message }
        });
    }
};