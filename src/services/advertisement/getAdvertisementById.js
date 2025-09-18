const Advertisement = require('../../models/advertisement');

module.exports = async (req, res) => {
  try {
    const { advertisementId } = req.params;

    const advertisement = await Advertisement.findById(advertisementId)
      .populate('requesterId', 'username email');

    if (!advertisement) {
      return res.recordNotFound({
        message: 'Advertisement not found'
      });
    }

    return res.success({
      message: 'Advertisement retrieved successfully',
      data: advertisement
    });
  } catch (error) {
    console.error('Get Advertisement Error:', error);
    return res.internalServerError({ message: error.message });
  }
}; 