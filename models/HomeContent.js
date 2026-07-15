const mongoose = require('mongoose');
const homeContentSchema = new mongoose.Schema({
  key: { type: String, default: 'homepage', unique: true },
  heroTitle: { type: String, default: 'ভোলা জেলা ডেন্টাল প্র্যাকটিশনার অ্যাসোসিয়েশন' },
  heroSub: { type: String, default: 'ভোলা জেলার সকল অনুমোদিত এবং ভেরিফাইড দন্ত চিকিৎসকদের একমাত্র পেশাদার প্ল্যাটফর্ম।' },
  welcomeTitle: { type: String, default: 'সংগঠনের মূল ভিত্তি, ভিশন ও মিশন' },
  welcomeText: { type: String, default: 'ভোলা জেলা ডেন্টাল প্র্যাকটিশনার অ্যাসোসিয়েশন ভোলার সাধারণ নাগরিকদের জন্য...' },
  mission: { type: String, default: 'ভোলার সাধারণ মানুষের কাছে আধুনিক ও নিরাপদ দন্ত চিকিৎসা পৌঁছে দেওয়া...' },
  vision: { type: String, default: 'ভোলার প্রতিটি দন্ত চিকিৎসকের মান উন্নয়ন...' },
  presidentMsg: { type: String, default: 'ভোলার জনগণের দন্ত চিকিৎসা সেবা নিশ্চিত করতে...' },
  presidentName: { type: String, default: 'ডাঃ মোঃ রফিকুল ইসলাম' },
  presidentPost: { type: String, default: 'সভাপতি, বিডিডিপিএ ভোলা' }
}, { timestamps: true });
module.exports = mongoose.model('HomeContent', homeContentSchema);