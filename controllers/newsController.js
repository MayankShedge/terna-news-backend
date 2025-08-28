const News = require('../models/News');
const User = require('../models/user'); // We need the User model for this

// Get all news (No changes here)
const getAllNews = async (req, res) => {
  // This function is not in the provided code, but I'm assuming it exists.
  // If not, you can add it back based on your previous versions.
  const { category } = req.query;
  try {
    let news;
    if (category) {
      news = await News.find({ category });
    } else {
      news = await News.find();
    }
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// Create new news (No changes here)
const createNews = async (req, res) => {
  const { title, description, category, source } = req.body; 
  try {
    const news = new News({ title, description, category, source });
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    res.status(400).json({ message: 'Error creating news' });
  }
};

// Rate a News Article (No changes here)
const rateNewsArticle = async (req, res) => {
  const { rating } = req.body;
  const newsId = req.params.id;

  try {
    const news = await News.findById(newsId);
    if (news) {
      const alreadyRated = news.ratings.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyRated) {
        return res.status(400).json({ message: 'You have already rated this article.' });
      }
      const newRating = {
        rating: Number(rating),
        user: req.user._id,
      };
      news.ratings.push(newRating);
      news.numReviews = news.ratings.length;
      news.averageRating =
        news.ratings.reduce((acc, item) => item.rating + acc, 0) /
        news.ratings.length;
      await news.save();
      res.status(201).json({ message: 'Rating added successfully' });
    } else {
      res.status(404).json({ message: 'News article not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// --- START: New Function for News Recommendations ---
const getRecommendedNews = async (req, res) => {
    try {
        const currentUser = req.user; // Logged-in user from 'protect' middleware

        // 1. Find articles the current user has rated highly (4 stars or more)
        const highlyRatedNews = await News.find({ 'ratings.user': currentUser._id, 'ratings.rating': { $gte: 4 } });
        const highlyRatedNewsIds = highlyRatedNews.map(news => news._id);

        if (highlyRatedNewsIds.length === 0) {
            // If the user hasn't rated anything highly, return top-rated news as a fallback
            const topNews = await News.find({}).sort({ averageRating: -1 }).limit(5);
            return res.json(topNews);
        }

        // 2. Find "taste twins": other users who also rated these same articles highly
        const similarUsers = await News.aggregate([
            { $match: { _id: { $in: highlyRatedNewsIds } } }, // Filter for the same highly-rated news
            { $unwind: '$ratings' }, // Deconstruct the ratings array
            { $match: { 'ratings.rating': { $gte: 4 }, 'ratings.user': { $ne: currentUser._id } } }, // Find high ratings from other users
            { $group: { _id: '$ratings.user', sharedLikes: { $sum: 1 } } }, // Group by user and count shared likes
            { $sort: { sharedLikes: -1 } }, // Sort to find the most similar users
            { $limit: 10 } // Limit to the top 10 most similar users
        ]);
        const similarUserIds = similarUsers.map(user => user._id);

        if (similarUserIds.length === 0) {
            // Fallback if no similar users are found
            const topNews = await News.find({}).sort({ averageRating: -1 }).limit(5);
            return res.json(topNews);
        }

        // 3. Find articles that these similar users liked but the current user hasn't seen
        const recommendedNews = await News.aggregate([
            { $match: { 'ratings.user': { $in: similarUserIds }, 'ratings.rating': { $gte: 4 } } }, // Articles liked by similar users
            { $match: { 'ratings.user': { $ne: currentUser._id } } }, // Exclude articles the current user has already rated
            { $sort: { averageRating: -1 } }, // Sort by the highest average rating
            { $limit: 5 } // Return the top 5 recommendations
        ]);
        
        res.json(recommendedNews);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error while fetching recommendations' });
    }
};
// --- END: New Function ---


// Update news (No changes here)
const updateNews = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedNews = await News.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: 'Error updating news' });
  }
};

// Delete news (No changes here)
const deleteNews = async (req, res) => {
  const { id } = req.params;
  try {
    await News.findByIdAndDelete(id);
    res.json({ message: 'News deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting news' });
  }
};

// --- CHANGE: Add getRecommendedNews to exports ---
module.exports = { getAllNews, createNews, updateNews, deleteNews, rateNewsArticle, getRecommendedNews };
