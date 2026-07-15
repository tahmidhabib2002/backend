const mongoose = require('mongoose');
const noticeSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Notice title is required'], trim: true },
  content: { type: String, required: [true, 'Notice content is required'] },
  category: { type: String, enum: ['General', 'Urgent', 'Meeting', 'Seminar'], default: 'General' },
  pdfUrl: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Notice', noticeSchema);