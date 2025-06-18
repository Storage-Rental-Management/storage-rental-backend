const createStorageUnit = require('../services/storageUnit/createStorageUnit');
const getAllStorageUnits = require('../services/storageUnit/getAllStorageUnits');
const getStorageUnitById = require('../services/storageUnit/getStorageUnitById');
const updateStorageUnit = require('../services/storageUnit/updateStorageUnit');
const deleteStorageUnit = require('../services/storageUnit/deleteStorageUnit');
const getDocumentTypes = require('../services/storageUnit/getDocumentTypes');

const create = async (req, res) => {
  try {
    await createStorageUnit(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    await getAllStorageUnits(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    await getStorageUnitById(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    await updateStorageUnit(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await deleteStorageUnit(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getDocumentList = async (req, res) => {
  try {
    await getDocumentTypes(req, res);
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
  getDocumentList
}; 