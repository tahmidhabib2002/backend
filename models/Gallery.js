const mongoose = require('mongoose');
const gallerySchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Media title is required'], trim: true },
  imageUrl: { type: String, required: [true, 'Media asset URL is required'] },
  category: { type: String, enum: ['Meetings', 'Seminars', 'Campaigns', 'Social'], default: 'Meetings' }
}, { timestamps: true });
module.exports = mongoose.model('Gallery', gallerySchema);