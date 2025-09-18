const RecommendedProperty = require('../../models/recommendedProperty');
const { RECOMMENDED_STATUS } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    const { recommendedId } = req.params;
    const updateData = req.body;

    // Find recommended record
    const recommended = await RecommendedProperty.findById(recommendedId);

    if (!recommended) {
      return res.recordNotFound({
        message: 'Recommended property not found'
      });
    }

    // Only allow update if status is UNDER_REVIEW
    if (recommended.status !== RECOMMENDED_STATUS.UNDER_REVIEW) {
      return res.badRequest({
        message: `Cannot update. Current status is "${recommended.status}"`,
      });
    }

    // Allowed fields
    const allowedUpdates = [
      'propertyId',
      'unitId',
      'startDate',
      'endDate',
      'description',
      'recommendedFor'
    ];

    // Build update object (only allowed fields)
    const updates = {};
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    }

    updates.updatedAt = new Date();

    // Perform update
    const updatedRecommended = await RecommendedProperty.findByIdAndUpdate(
      recommendedId,
      { $set: updates },
      { new: true }
    )
      .populate('requesterId', 'username email')
      .populate('propertyId', 'companyName')
      .populate('unitId', 'name');

    return res.success({
      message: 'Recommended property updated successfully',
      data: updatedRecommended,
    });

  } catch (error) {
    console.error('Update RecommendedProperty Error:', error);
    return res.internalServerError({ message: error.message });
  }
};
