const Notice = require('../models/Notice');
const News = require('../models/News');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const ContactMessage = require('../models/ContactMessage');
const HomeContent = require('../models/HomeContent');
const EmailLog = require('../models/EmailLog');
const Member = require('../models/Member');
const transporter = require('../config/email');
const ActivityLog = require('../models/ActivityLog');

const createDoc = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

const updateDoc = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

const deleteDoc = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) { next(err); }
};

exports.createNotice = createDoc(Notice);
exports.updateNotice = updateDoc(Notice);
exports.deleteNotice = deleteDoc(Notice);

exports.createNews = createDoc(News);
exports.updateNews = updateDoc(News);
exports.deleteNews = deleteDoc(News);

exports.createEvent = createDoc(Event);
exports.updateEvent = updateDoc(Event);
exports.deleteEvent = deleteDoc(Event);

exports.createGallery = createDoc(Gallery);
exports.deleteGallery = deleteDoc(Gallery);

exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 });
    res.status(200).json({ success: true, results: events.length, data: events });
  } catch (err) { next(err); }
};

exports.getHomeContent = async (req, res, next) => {
  try {
    let content = await HomeContent.findOne({ key: 'homepage' });
    if (!content) content = await HomeContent.create({ key: 'homepage' });
    res.status(200).json({ success: true, data: content });
  } catch (err) { next(err); }
};

exports.updateHomeContent = async (req, res, next) => {
  try {
    const content = await HomeContent.findOneAndUpdate({ key: 'homepage' }, req.body, { new: true, upsert: true });
    res.status(200).json({ success: true, data: content });
  } catch (err) { next(err); }
};

exports.submitContactMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.create(req.body);
    res.status(201).json({ success: true, message: 'Sent successfully', data: msg });
  } catch (err) { next(err); }
};

exports.getContactMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, results: messages.length, data: messages });
  } catch (err) { next(err); }
};

exports.deleteContactMessage = deleteDoc(ContactMessage);

exports.globalAdminSearch = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, message: 'Search query missing.' });

    const regex = { $regex: query, $options: 'i' };
    const [members, notices, news] = await Promise.all([
      Member.find({ $or: [{ nameEn: regex }, { nameBn: regex }, { memberId: regex }] }).limit(10),
      Notice.find({ title: regex }).limit(10),
      News.find({ title: regex }).limit(10)
    ]);

    res.status(200).json({ success: true, results: { members, notices, news } });
  } catch (err) { next(err); }
};

exports.broadcastEmail = async (req, res, next) => {
  const { subject, message, recipientGroup } = req.body;
  if (!subject || !message || !recipientGroup) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
  }

  try {
    let query = {};
    if (recipientGroup === 'Active') query = { status: 'Active' };
    else if (recipientGroup === 'Committee') query = { roleType: 'Executive Committee' };

    const members = await Member.find(query).select('email');
    const emails = members.map(m => m.email).filter(e => !!e);

    if (emails.length === 0) return res.status(400).json({ success: false, message: 'No emails found in this group.' });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"BDDPA Bhola" <noreply@bddpa-bhola.org>',
      bcc: emails.join(','),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0c4a6e; color: #fff; padding: 20px; text-align: center;"><h2 style="margin: 0;">BDDPA ভোলা</h2></div>
          <div style="padding: 24px;">${message}</div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color:#64748b;">© ২০২৬ BDDPA ভোলা। এটি একটি অফিসিয়াল বার্তা।</div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    const log = await EmailLog.create({ subject, recipientGroup, recipientsCount: emails.length, sentBy: req.user._id, status: 'Success' });
    await ActivityLog.create({ user: req.user._id, action: 'Email Broadcast', details: `Sent broadcast "${subject}" to ${emails.length} recipients`, ipAddress: req.ip || '127.0.0.1' });

    res.status(200).json({ success: true, message: 'Email broadcast sent.', data: log });
  } catch (err) {
    await EmailLog.create({ subject, recipientGroup, sentBy: req.user?._id, status: 'Failed', errorDetails: err.message });
    next(err);
  }
};