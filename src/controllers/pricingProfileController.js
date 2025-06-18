const createPricingProfile = require('../services/pricingProfile/createPricingProfile');
const getAllPricingProfiles = require('../services/pricingProfile/getAllPricingProfiles');
const getPricingProfileById = require('../services/pricingProfile/getPricingProfileById');
const updatePricingProfile = require('../services/pricingProfile/updatePricingProfile');
const deletePricingProfile = require('../services/pricingProfile/deletePricingProfile');

const create = async (req, res) => {
  try {
    await createPricingProfile(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    await getAllPricingProfiles(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    await getPricingProfileById(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    await updatePricingProfile(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await deletePricingProfile(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
}; 