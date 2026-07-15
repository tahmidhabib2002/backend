const express = require('express');
const router = express.Router();
const { getAnalytics, getActivityLogs, getSystemSettings, updateSystemSettings } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.get('/analytics', protect, getAnalytics);
router.get('/logs', protect, restrictTo('Super Admin', 'Admin'), getActivityLogs);
router.route('/settings')
  .get(protect, restrictTo('Super Admin'), getSystemSettings)
  .put(protect, restrictTo('Super Admin'), updateSystemSettings);

module.exports = router;