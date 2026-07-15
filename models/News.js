const mongoose = require('mongoose');
const newsSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'News title is required'], trim: true },
  summary: { type: String, required: [true, 'News summary is required'], trim: true },
  content: { type: String, required: [true, 'News content is required'] },
  coverImage: { type: String, default: '' },
  category: { type: String, default: 'Event' }
}, { timestamps: true });
module.exports = mongoose.model('News', newsSchema);