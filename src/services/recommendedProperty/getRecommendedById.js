const Recommended = require("../../models/recommendedProperty");

module.exports = async (req, res) => {
  try {
    const { recommendedId } = req.params;

    const recommended = await Recommended.findById(recommendedId)
      .populate("requesterId", "username email")
      .populate("propertyId", "companyName status")
      .populate("unitId", "name status");

    if (!recommended) {
      return res.recordNotFound({
        message: "Recommended item not found",
      });
    }

    return res.success({
      message: "Recommended retrieved successfully",
      data: recommended,
    });
  } catch (error) {
    console.error("Get Recommended Error:", error);
    return res.internalServerError({ message: error.message });
  }
};
