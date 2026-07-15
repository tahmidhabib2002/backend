const News = require('../models/News');
exports.getAllNews = async (req, res, next) => {
  try {
    const newsItems = await News.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, results: newsItems.length, data: newsItems });
  } catch (error) { next(error); }
};