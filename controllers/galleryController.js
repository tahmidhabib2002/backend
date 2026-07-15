const Gallery = require('../models/Gallery');
exports.getGalleryAssets = async (req, res, next) => {
  try {
    const { category } = req.query;
    let queryObj = {};
    if (category) queryObj.category = category;

    const assets = await Gallery.find(queryObj).sort({ createdAt: -1 });
    res.status(200).json({ success: true, results: assets.length, data: assets });
  } catch (error) { next(error); }
};