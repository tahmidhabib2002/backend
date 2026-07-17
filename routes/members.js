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
router.post('/apply', createMember);            // Public registration
router.get('/', getMembers);                    // Public directory
router.get('/verify', verifyMemberLookup);      // Verification
router.get('/profile/:slug', getPublicProfile); // Public profile

// ============ ADMIN PROTECTED ROUTES ============
router.post('/', protect, restrictTo('Super Admin', 'Admin'), validateMemberInput, createMember);
router.put('/:id', protect, restrictTo('Super Admin', 'Admin', 'Editor'), updateMember);
router.delete('/:id', protect, restrictTo('Super Admin', 'Admin'), deleteMember);
router.get('/export/csv', protect, restrictTo('Super Admin', 'Admin'), exportMembersCSV);

module.exports = router;
