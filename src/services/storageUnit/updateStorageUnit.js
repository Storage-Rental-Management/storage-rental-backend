const { StorageUnit, StorageProperty } = require("../../models");
const {
  storageUnitUpdateSchema,
} = require("../../validation/storageUnitValidation");

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize unitImage to always be an array
    let unitImage = req.body.unitImage;
    if (unitImage && !Array.isArray(unitImage)) {
      unitImage = [unitImage];
    }
    req.body.unitImage = unitImage || [];

     if (
      req.body.requiredDocuments &&
      !Array.isArray(req.body.requiredDocuments)
    ) {
      req.body.requiredDocuments = [req.body.requiredDocuments];
    }

    const { error, value } = storageUnitUpdateSchema.validate(req.body);
    if (error)
      return res.validationError({ message: error.details[0].message });

    if (value.pricingProfileId && value.customPricingProfileName) {
      return res.validationError({
        message:
          "Only one of pricingProfileId or customPricingProfileName should be provided",
      });
    }

    // Get existing unit
    const existingUnit = await StorageUnit.findById(id);
    if (!existingUnit) {
      return res.recordNotFound({ message: "Storage unit not found" });
    }

    // Get new uploaded image paths
    const imagePaths =
      req.files?.map((file) => `/uploads/storageUnit/${file.filename}`) || [];

    // Merge existing and new images
    const updateData = { ...value };
    updateData.unitImage = [...(unitImage || []), ...imagePaths];
    updateData.requiredDocuments = value.requiredDocuments || [];

    const updated = await StorageUnit.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated)
      return res.recordNotFound({ message: "Storage unit not found" });

    if (updated.propertyId !== existingUnit.propertyId) {
      await StorageProperty.findByIdAndUpdate(existingUnit.propertyId, { $inc: { unitCount: -1 } });
      await StorageProperty.findByIdAndUpdate(updated.propertyId, { $inc: { unitCount: 1 } });
    }

    return res.success({ data: updated, message: "Storage unit updated" });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to update storage unit",
      data: { errors: error.message },
    });
  }
};
