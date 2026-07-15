const mongoose = require('mongoose');
const emailLogSchema = new mongoose.Schema({
  subject: { type: String, required: [true, 'Subject is required'], trim: true },
  recipientGroup: { type: String, required: true },
  recipientsCount: { type: Number, default: 0 },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  errorDetails: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('EmailLog', emailLogSchema);