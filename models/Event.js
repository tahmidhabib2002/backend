const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Event title is required'], trim: true },
  description: { type: String, required: [true, 'Event description is required'] },
  location: { type: String, required: [true, 'Event location is required'], trim: true },
  mapLink: { type: String, default: '', trim: true },
  eventDate: { type: Date, required: [true, 'Event date is required'] },
  startTime: { type: String, default: '', trim: true },
  endTime: { type: String, default: '', trim: true },
  registrationLink: { type: String, default: '', trim: true },
  coverImage: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Event', eventSchema);