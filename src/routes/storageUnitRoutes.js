const express = require('express');
const multer = require('multer');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const storageUnitController = require('../controllers/storageUnitController');

const upload = multer({ dest: 'uploads/StorageUnit' });

router.post('/', isAuthenticated, upload.array('unitImage', 5), storageUnitController.create);
router.get('/', isAuthenticated, storageUnitController.getAll);
router.get('/document-types', isAuthenticated, storageUnitController.getDocumentList);
router.get('/:id', isAuthenticated, storageUnitController.getById);
router.put('/:id', isAuthenticated, upload.array('unitImage', 5), storageUnitController.update);
router.delete('/:id', isAuthenticated, storageUnitController.remove);

module.exports = router; 