const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

const { 
  getAllNews,        
  createNews,        
  updateNews,        
  deleteNews,        
  rateNewsArticle,   
  getRecommendedNews 
} = require('../controllers/newsController');

const { sendWeeklyNewsletter, cleanupUnverifiedUsers } = require('../jobs/cronJobs');

router.route('/recommendations').get(protect, getRecommendedNews);

router.get('/', getAllNews);

router.get('/:id', async (req, res) => {
  try {
    const News = require('../models/News');
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, createNews);

router.post('/:id/rate', protect, rateNewsArticle);

router.put('/:id', protect, admin, updateNews);

router.delete('/:id', protect, admin, deleteNews);

router.get('/cron/newsletter', async (req, res) => {
  try {
    await sendWeeklyNewsletter();
    res.json({ success: true, message: 'Newsletter sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cron/cleanup', async (req, res) => {
  try {
    await cleanupUnverifiedUsers();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;