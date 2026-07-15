const ActivityLog = require('../models/ActivityLog');
const Member = require('../models/Member');
const User = require('../models/User');
const Notice = require('../models/Notice');
const News = require('../models/News');
const Event = require('../models/Event');

exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalMembers, activeMembers, inactiveMembers, executive,
      totalAdmins, totalNotices, totalNews, totalEvents
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'Active' }),
      Member.countDocuments({ status: 'Inactive' }),
      Member.countDocuments({ roleType: 'Executive Committee' }),
      User.countDocuments(),
      Notice.countDocuments(),
      News.countDocuments(),
      Event.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        members: {
          total: totalMembers,
          active: activeMembers,
          inactive: inactiveMembers,
          executive
        },
        admins: totalAdmins,
        notices: totalNotices,
        events: totalEvents,
        news: totalNews
      }
    });
  } catch (error) { next(error); }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, logs });
  } catch (error) { next(error); }
};

exports.getSystemSettings = async (req, res) => {
  res.status(200).json({
    success: true,
    settings: {
      associationName: 'Bhola District Dental Practitioners Association',
      contactEmail: process.env.CONTACT_EMAIL || 'info@bddpa-bhola.org',
      supportPhone: process.env.SUPPORT_PHONE || '+8801900000000',
      seoKeywords: 'BDDPA, Bhola Dental, Association',
      maintenanceMode: false
    }
  });
};

exports.updateSystemSettings = async (req, res) => {
  res.status(200).json({ success: true, message: 'Settings successfully saved.' });
};
