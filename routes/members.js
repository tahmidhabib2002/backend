const express = require('express');
const router = express.Router();
const { createMember, updateMember, deleteMember, getMembers, getPublicProfile, verifyMemberLookup, exportMembersCSV } = require('../controllers/memberController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { validateMemberInput } = require('../middlewares/validation');

router.get('/', getMembers);
router.get('/verify', verifyMemberLookup);
router.get('/profile/:slug', getPublicProfile);

// অনলাইন মেম্বারশিপ আবেদনের জন্য নতুন পাবলিক রাউট (কোনো অ্যাডমিন প্রটেকশন লাগবে না)
router.post('/apply', createMember);

router.post('/', protect, restrictTo('Super Admin', 'Admin'), validateMemberInput, createMember);
router.put('/:id', protect, restrictTo('Super Admin', 'Admin', 'Editor'), updateMember);
router.delete('/:id', protect, restrictTo('Super Admin', 'Admin'), deleteMember);
router.get('/export/csv', protect, restrictTo('Super Admin', 'Admin'), exportMembersCSV);

module.exports = router;
