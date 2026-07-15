const express = require('express');
const router = express.Router();
const { login, googleLogin, getCurrentUser, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authenticationLimiter } = require('../middlewares/rateLimiter');

router.post('/login', authenticationLimiter, login);
router.post('/google', authenticationLimiter, googleLogin);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);

module.exports = router;