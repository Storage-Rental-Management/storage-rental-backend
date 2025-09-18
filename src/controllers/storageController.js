const createStorageProperty = require('../services/storageProperty/createStorageProperty');
const getAllStorageProperties = require('../services/storageProperty/getAllStorageProperties');
const getStoragePropertyById = require('../services/storageProperty/getStoragePropertyById');
const updateStorageProperty = require('../services/storageProperty/updateStorageProperty');
const deleteStorageProperty = require('../services/storageProperty/deleteStorageProperty');
const getStoragePropertiesPublic = require('../services/storageProperty/getStoragePropertiesPublic');
const recommendStorageProperty = require('../services/storageProperty/recommendStorageProperty');

const create = async (req, res) => {
  try {
    await createStorageProperty(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    await getAllStorageProperties(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    await getStoragePropertyById(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    await updateStorageProperty(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await deleteStorageProperty(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getPublic = async (req, res) => {
  try {
    await getStoragePropertiesPublic(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}

const recommendProperty = async (req, res) => {
  try {
    await recommendStorageProperty(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove, 
  getPublic,
  recommendProperty
};
