const StorageProperty = require("../../models/storageProperty");
const StorageUnit = require("../../models/storageUnit");
const Advertisement = require("../../models/advertisement");

const modelMap = {
  "storage-properties": {
    model: StorageProperty,
    imageField: "propertyImage",
  },
  units: {
    model: StorageUnit,
    imageField: "unitImage",
  },
  advertisements: {
    model: Advertisement,
    imageField: "adImages",
  },
};

module.exports = async (req, res) => {
  try {
    const { module, id } = req.params;
    const { imageUrl } = req.query;

    if (!imageUrl) {
      return res.badRequest({ message: "Image URL is required" });
    }

    const config = modelMap[module];
    if (!config) {
      return res.badRequest({ message: "Invalid module type" });
    }

    const doc = await config.model.findById(id);
    if (!doc) {
      return res.recordNotFound({ message: "Document not found" });
    }

    const currentImages = doc[config.imageField] || [];

    const filteredImages = currentImages.filter((img) => img !== imageUrl);

    doc[config.imageField] = filteredImages;

    await doc.save();

    return res.success({
      message: "Image removed successfully",
      data: doc,
    });
  } catch (error) {
    return res.internalServerError({ message: "Failed to remove image" });
  }
};
