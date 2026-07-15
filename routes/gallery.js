const express = require('express');
const router = express.Router();
const { getGalleryAssets } = require('../controllers/galleryController');
router.get('/', getGalleryAssets);
module.exports = router;