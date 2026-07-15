const mongoose = require('mongoose');
const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Sender name is required'], trim: true },
  email: { type: String, required: [true, 'Email address is required'], trim: true, lowercase: true },
  message: { type: String, required: [true, 'Message content is required'] },
  status: { type: String, enum: ['New', 'Archived', 'Replied'], default: 'New' }
}, { timestamps: true });
module.exports = mongoose.model('ContactMessage', contactMessageSchema);