const express = require('express');
const router = express.Router();
const {
  createMember,
  updateMember,
  deleteMember,
  getMembers,
  getPublicProfile,
  verifyMemberLookup,
  exportMembersCSV
} = require('../controllers/memberController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { validateMemberInput } = require('../middlewares/validation');

// ============ PUBLIC ROUTES (No Auth Required) ============
// নোট: /apply এখন server.js এ ডাইরেক্ট হ্যান্ডেল করা হচ্ছে
// কিন্তু এখানেও রেখে দিচ্ছি ব্যাকআপ হিসেবে
router.post('/apply', createMember);        // Public registration (ব্যাকআপ)
router.get('/', getMembers);                // Public directory
router.get('/verify', verifyMemberLookup);  // Verification
router.get('/profile/:slug', getPublicProfile); // Public profile

// ============ ADMIN PROTECTED ROUTES ============
router.post('/', protect, restrictTo('Super Admin', 'Admin'), validateMemberInput, createMember);
router.put('/:id', protect, restrictTo('Super Admin', 'Admin', 'Editor'), updateMember);
router.delete('/:id', protect, restrictTo('Super Admin', 'Admin'), deleteMember);
router.get('/export/csv', protect, restrictTo('Super Admin', 'Admin'), exportMembersCSV);

module.exports = router;
