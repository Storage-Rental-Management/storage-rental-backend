const getRoleService = require('../services/role/getRole');

const getAllRoles = async (req, res) => {
    try {
        await getRoleService(req, res);
    } catch (error) {
        return res.internalServerError({ message: error.message });
    }
}

module.exports = {
    getAllRoles
};