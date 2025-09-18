const Role = require("../../models/role");
module.exports = async (req, res) => {
  try {
    const roles = await Role.find();
    return res.success({
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    res.internalServerError({ message: "Internal Server Error" });
  }
};
