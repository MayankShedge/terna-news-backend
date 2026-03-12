const News = require('../models/News');
const User = require('../models/User');
const { sendNewArticleEmail } = require('../utils/sendEmail'); 

const getAllNews = async (req, res) => {
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

const createNews = async (req, res) => {
  const { title, description, category, source } = req.body; 
  try {
    const news = new News({ title, description, category, source });
    const savedNews = await news.save();

    try {
      console.log('📧 Sending notification emails...');
      
      const usersToNotify = await User.find({ isVerified: true });
      
      if (usersToNotify.length === 0) {
        console.log('✅ No verified users to notify.');
      } else {
        console.log(`📬 Notifying ${usersToNotify.length} verified users...`);
        
        const articleForEmail = {
          _id: savedNews._id,
          title: savedNews.title,
          category: savedNews.category,
          content: savedNews.description,
          excerpt: savedNews.description.substring(0, 200),
          createdAt: savedNews.createdAt,
          author: 'Terna News Team' 
        };
        
        for (const user of usersToNotify) {
          try {
            await sendNewArticleEmail(user.email, user.name, articleForEmail);
            console.log(`✅ Sent to ${user.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send to ${user.email}:`, emailError.message);
          }
        }
        
        console.log('✅ Finished sending all notification emails.');
      }
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError);
    }

    res.status(201).json(savedNews);

  } catch (error) {
    res.status(400).json({ message: 'Error creating news' });
  }
};

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

const getRecommendedNews = async (req, res) => {
    try {
        const currentUser = req.user;
        const highlyRatedNews = await News.find({ 'ratings.user': currentUser._id, 'ratings.rating': { $gte: 4 } });
        const highlyRatedNewsIds = highlyRatedNews.map(news => news._id);

        if (highlyRatedNewsIds.length === 0) {
            const topNews = await News.find({}).sort({ averageRating: -1 }).limit(5);
            return res.json(topNews);
        }

        const similarUsers = await News.aggregate([
            { $match: { _id: { $in: highlyRatedNewsIds } } },
            { $unwind: '$ratings' },
            { $match: { 'ratings.rating': { $gte: 4 }, 'ratings.user': { $ne: currentUser._id } } },
            { $group: { _id: '$ratings.user', sharedLikes: { $sum: 1 } } },
            { $sort: { sharedLikes: -1 } },
            { $limit: 10 }
        ]);
        const similarUserIds = similarUsers.map(user => user._id);

        if (similarUserIds.length === 0) {
            const topNews = await News.find({}).sort({ averageRating: -1 }).limit(5);
            return res.json(topNews);
        }

        const recommendedNews = await News.aggregate([
            { $match: { 'ratings.user': { $in: similarUserIds }, 'ratings.rating': { $gte: 4 } } },
            { $match: { 'ratings.user': { $ne: currentUser._id } } },
            { $sort: { averageRating: -1 } },
            { $limit: 5 }
        ]);
        
        res.json(recommendedNews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error while fetching recommendations' });
    }
};

const updateNews = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedNews = await News.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: 'Error updating news' });
  }
};

const deleteNews = async (req, res) => {
  const { id } = req.params;
  try {
    await News.findByIdAndDelete(id);
    res.json({ message: 'News deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting news' });
  }
};

module.exports = { getAllNews, createNews, updateNews, deleteNews, rateNewsArticle, getRecommendedNews };