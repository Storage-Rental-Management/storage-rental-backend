const removeImageService = require("../services/removeImage/removeImage")

const removeImage = async (req, res) => {
  try {
    await removeImageService(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  removeImage,
};
