const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  rateNewsArticle,
  getRecommendedNews,
  toggleBookmark,
  getBookmarks,
} = require('../controllers/newsController');

const { sendWeeklyNewsletter, cleanupUnverifiedUsers } = require('../jobs/cronJobs');

router.get('/recommendations', protect, getRecommendedNews);

router.get('/bookmarks/me', protect, getBookmarks);

router.get('/cron/newsletter', protect, admin, async (req, res) => {
  try {
    await sendWeeklyNewsletter();
    res.json({ success: true, message: 'Newsletter sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cron/cleanup', protect, admin, async (req, res) => {
  try {
    await cleanupUnverifiedUsers();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.route('/').get(getAllNews).post(protect, admin, createNews);

router
  .route('/:id')
  .get(getNewsById)
  .put(protect, admin, updateNews)
  .delete(protect, admin, deleteNews);

router.post('/:id/rate', protect, rateNewsArticle);

router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;