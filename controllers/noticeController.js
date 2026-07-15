const Notice = require('../models/Notice');
exports.getAllNotices = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let queryObj = {};
    if (search) queryObj.title = { $regex: search, $options: 'i' };
    if (category) queryObj.category = category;

    const notices = await Notice.find(queryObj).sort({ createdAt: -1 });
    res.status(200).json({ success: true, results: notices.length, data: notices });
  } catch (error) { next(error); }
};