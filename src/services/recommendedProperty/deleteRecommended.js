const RecommendedProperty = require("../../models/recommendedProperty");

module.exports = async (req, res) => {
  try {
    const { recommendedId } = req.params;

    const recommended = await RecommendedProperty.findByIdAndDelete(
      recommendedId
    );

    if (!recommended) {
      return res.recordNotFound({
        message: "Recommendation request not found",
      });
    }

    return res.success({
      message: "Recommendation request deleted successfully",
    });
  } catch (error) {
    console.error("Delete Recommendation Error:", error);
    return res.internalServerError({ message: error.message });
  }
};
