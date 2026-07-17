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

// ============ পাবলিক রুট (কোনো অথেনটিকেশন লাগবে না) ============
router.post('/apply', createMember);  // 👈 পাবলিক রেজিস্ট্রেশন এন্ডপয়েন্ট
router.get('/', getMembers);         // পাবলিক ডিরেক্টরি লিস্ট
router.get('/verify', verifyMemberLookup); // ভেরিফিকেশন
router.get('/profile/:slug', getPublicProfile); // পাবলিক প্রোফাইল

// ============ অ্যাডমিন প্রটেক্টেড রুট ============
router.post('/', protect, restrictTo('Super Admin', 'Admin'), validateMemberInput, createMember);
router.put('/:id', protect, restrictTo('Super Admin', 'Admin', 'Editor'), updateMember);
router.delete('/:id', protect, restrictTo('Super Admin', 'Admin'), deleteMember);
router.get('/export/csv', protect, restrictTo('Super Admin', 'Admin'), exportMembersCSV);

module.exports = router;
