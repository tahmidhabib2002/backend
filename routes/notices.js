const express = require('express');
const router = express.Router();
const { getAllNotices } = require('../controllers/noticeController');
router.get('/', getAllNotices);
module.exports = router;