const Advertisement = require('../../models/advertisement');

module.exports = async (req, res) => {
  try {
    const { advertisementId } = req.params;
    const { status } = req.body;

    const advertisement = await Advertisement.findByIdAndUpdate(
      advertisementId,
      { status },
      { new: true }
    );

    if (!advertisement) {
      return res.recordNotFound({
        message: 'Advertisement not found'
      });
    }

    return res.success({
      message: 'Advertisement status updated successfully',
      data: advertisement
    });
  } catch (error) {
    console.error('Update Advertisement Status Error:', error);
    return res.internalServerError({ message: error.message });
  }
};