const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const storageUnitController = require('../controllers/storageUnitController');
const getUploader = require('../middlewares/upload');

const upload = getUploader('storageUnit');

router.get('/', isAuthenticated, storageUnitController.getAll);
router.get('/public', storageUnitController.getPublic);
router.get('/stats', isAuthenticated, storageUnitController.getStats);
router.get('/document-types', isAuthenticated, storageUnitController.getDocumentList);
router.post('/', isAuthenticated, upload.array('unitImage', 5), storageUnitController.create);
router.get('/:id', isAuthenticated, storageUnitController.getById);
router.put('/:id', isAuthenticated, upload.array('unitImage', 5), storageUnitController.update);
router.delete('/:id', isAuthenticated, storageUnitController.remove);

router.put('/:id/recommend', isAuthenticated, storageUnitController.recommendUnit);

module.exports = router;
