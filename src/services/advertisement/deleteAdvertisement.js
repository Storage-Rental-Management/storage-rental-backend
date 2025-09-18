const Advertisement = require('../../models/advertisement');

module.exports = async (req, res) => {
  try {
    const { advertisementId } = req.params;

    const advertisement = await Advertisement.findByIdAndDelete(advertisementId);

    if (!advertisement) {
      return res.recordNotFound({
        message: 'Advertisement not found'
      });
    }

    return res.success({
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error('Delete Advertisement Error:', error);
    return res.internalServerError({ message: error.message });
  }
}; 