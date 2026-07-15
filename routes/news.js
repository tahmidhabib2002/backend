const express = require('express');
const router = express.Router();
const { getAllNews } = require('../controllers/newsController');
router.get('/', getAllNews);
module.exports = router;