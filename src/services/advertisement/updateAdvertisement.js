const Advertisement = require('../../models/advertisement');

module.exports = async (req, res) => {
  try {
    const { advertisementId } = req.params;
    const updateData = req.body;

    // Normalize adImages to always be an array (handles both string and array cases)
    let adImages = updateData.adImages;
    if (adImages && !Array.isArray(adImages)) {
      adImages = [adImages];
    }
    adImages = adImages || [];

    // Handle new uploaded images (if any)
    const uploadedImages = req.files ? req.files.map(file => `/uploads/advertisements/${file.filename}`) : [];

    // Merge existing and new images
    adImages = [...adImages, ...uploadedImages];

    const advertisement = await Advertisement.findByIdAndUpdate(
      advertisementId,
      {
        ...updateData,
        adImages,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('requesterId', 'username email');

    if (!advertisement) {
      return res.recordNotFound({ message: 'Advertisement not found' });
    }

    return res.success({
      message: 'Advertisement updated successfully',
      data: advertisement
    });

  } catch (error) {
    console.error('Update Advertisement Error:', error);
    return res.internalServerError({ message: error.message });
  }
};
