const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const storageController = require('../controllers/storageController');
const getUploader = require('../middlewares/upload');

const upload = getUploader('storageProperty');

router.get('/public', storageController.getPublic);
router.get('/', isAuthenticated, storageController.getAll);
router.get('/:id', isAuthenticated, storageController.getById);
router.post('/', isAuthenticated, upload.array('propertyImage', 5), storageController.create);
router.put('/:id', isAuthenticated, upload.array('propertyImage', 5), storageController.update);
router.delete('/:id', isAuthenticated, storageController.remove);

router.put('/:id/recommend', isAuthenticated, storageController.recommendProperty);

module.exports = router;
