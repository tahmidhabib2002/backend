const express = require('express');
const router = express.Router();
const {
  createNotice, updateNotice, deleteNotice,
  createNews, updateNews, deleteNews,
  createEvent, updateEvent, deleteEvent, getEvents,
  createGallery, deleteGallery,
  getHomeContent, updateHomeContent,
  submitContactMessage, getContactMessages, deleteContactMessage,
  globalAdminSearch, broadcastEmail
} = require('../controllers/cmsController');

const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.get('/home', getHomeContent);
router.get('/events', getEvents);
router.post('/contact', submitContactMessage);

router.use(protect);
router.get('/search', globalAdminSearch);
router.get('/messages', restrictTo('Super Admin', 'Admin'), getContactMessages);
router.delete('/messages/:id', restrictTo('Super Admin', 'Admin'), deleteContactMessage);
router.put('/home', restrictTo('Super Admin'), updateHomeContent);
router.post('/broadcast', restrictTo('Super Admin', 'Admin'), broadcastEmail);

router.route('/notices').post(restrictTo('Super Admin', 'Admin', 'Editor'), createNotice);
router.route('/notices/:id')
  .put(restrictTo('Super Admin', 'Admin', 'Editor'), updateNotice)
  .delete(restrictTo('Super Admin', 'Admin'), deleteNotice);

router.route('/news').post(restrictTo('Super Admin', 'Admin', 'Editor'), createNews);
router.route('/news/:id')
  .put(restrictTo('Super Admin', 'Admin', 'Editor'), updateNews)
  .delete(restrictTo('Super Admin', 'Admin'), deleteNews);

router.route('/events').post(restrictTo('Super Admin', 'Admin', 'Editor'), createEvent);
router.route('/events/:id')
  .put(restrictTo('Super Admin', 'Admin', 'Editor'), updateEvent)
  .delete(restrictTo('Super Admin', 'Admin'), deleteEvent);

router.route('/gallery').post(restrictTo('Super Admin', 'Admin', 'Editor'), createGallery);
router.route('/gallery/:id').delete(restrictTo('Super Admin', 'Admin'), deleteGallery);

module.exports = router;