const express = require('express');
const multer = require('multer');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const storageController = require('../controllers/storageController');

const upload = multer({ dest: 'uploads/storageProperty' });

router.post('/', isAuthenticated, upload.array('propertyImage', 5), storageController.create);
router.get('/', isAuthenticated, storageController.getAll);
router.get('/:id', isAuthenticated, storageController.getById);
router.put('/:id', isAuthenticated, upload.array('propertyImage', 5), storageController.update);
router.delete('/:id', isAuthenticated, storageController.remove);

module.exports = router;