const StorageProperty = require('../../models/storageProperty');

// module.exports = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const deleted = await StorageProperty.findByIdAndDelete(id);
//         if (!deleted) return res.recordNotFound({ message: 'Property not found' });
//         return res.success({ message: 'Property deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting storage property:', error);
//         return res.internalServerError({ message: 'Failed to delete storage property', data: { errors: error.message } });
//     }
// };

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

        return res.success({ message: 'Property deleted successfully (soft delete)' });
    } catch (error) {
        console.error('Error soft deleting storage property:', error);
        return res.internalServerError({
            message: 'Failed to soft delete storage property',
            data: { errors: error.message }
        });
    }
};