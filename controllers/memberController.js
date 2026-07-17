const Member = require('../models/Member');
const Counter = require('../models/Counter');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');

// ফাইল আপলোডের হেল্পার ফাংশন
const uploadFile = async (base64Str, folderName) => {
  if (!base64Str || !base64Str.startsWith('data:')) return '';
  try {
    const uploadRes = await cloudinary.uploader.upload(base64Str, {
      folder: `bddpa/${folderName}`,
      transformation: [{ width: 1000, crop: "limit", quality: "auto" }]
    });
    return uploadRes.secure_url;
  } catch (err) {
    console.error("Cloudinary error:", err);
    return '';
  }
};

// সদস্য আবেদন বা নতুন সদস্য তৈরি
exports.createMember = async (req, res, next) => {
  try {
    const existingPhone = await Member.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }

    // ১. ফ্রন্টএন্ড-ব্যাকএন্ড ইমেজ ফিল্ড নেমিং ম্যাচিং (Naming Normalization)
    if (req.body.nidPhoto) {
      req.body.nidFront = req.body.nidFront || req.body.nidPhoto;
    }
    if (req.body.degreePhoto) {
      req.body.degreeCertificate = req.body.degreeCertificate || req.body.degreePhoto;
    }

    // ২. মেম্বার আইডি কাউন্টার এবং জেনারেশন
    const counter = await Counter.findOneAndUpdate({ id: 'memberId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    const seqStr = String(counter.seq).padStart(4, '0');
    const genMemberId = `BDPA-${seqStr}`;

    // ৩. স্ল্যাগ জেনারেশন (সদস্য প্রোফাইল লিংকের জন্য)
    let baseSlug = req.body.nameEn.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
    let uniqueSlug = baseSlug;
    let slugExists = await Member.findOne({ slug: uniqueSlug });
    let suffix = 1;
    while (slugExists) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      slugExists = await Member.findOne({ slug: uniqueSlug });
      suffix++;
    }

    // ৪. ছবি আপলোড হ্যান্ডলিং
    const profilePhoto = await uploadFile(req.body.profilePhoto, 'profiles');
    const nidFront = await uploadFile(req.body.nidFront, 'documents');
    const nidBack = await uploadFile(req.body.nidBack, 'documents');
    const degreeCertificate = await uploadFile(req.body.degreeCertificate, 'documents');

    // ৫. সিকিউরিটি ফিল্ড ভ্যালিডেশন (পাবলিক আবেদনের ক্ষেত্রে ডাটা ফোর্স করা)
    const memberData = {
      ...req.body,
      memberId: genMemberId,
      slug: uniqueSlug,
      profilePhoto,
      nidFront,
      nidBack,
      degreeCertificate
    };

    if (req.user) {
      // যদি লগইন করা অ্যাডমিন মেম্বার তৈরি করেন
      memberData.createdBy = req.user._id;
    } else {
      // যদি পাবলিক ইউজার নিজে রেজিস্ট্রেশন ফর্ম থেকে আবেদন করেন
      memberData.status = 'Pending';
      memberData.roleType = 'General Member';
      memberData.executivePost = '';
      memberData.joiningDate = new Date().toISOString();
    }

    const newMember = await Member.create(memberData);
    const publicUrl = `${process.env.FRONTEND_URL || ''}/#/members/${uniqueSlug}`;
    newMember.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`;
    await newMember.save();

    // ৬. ক্র্যাশ ছাড়া অ্যাক্টিভিটি লগ নিশ্চিত করা (Defensive Log)
    if (req.user) {
      await ActivityLog.create({ 
        user: req.user._id, 
        action: 'Create Member', 
        details: `Created ${newMember.nameEn} (ID: ${genMemberId})`, 
        ipAddress: req.ip || '127.0.0.1' 
      });
    } else {
      await ActivityLog.create({ 
        action: 'Public Registration Request', 
        details: `Pending Application received from ${newMember.nameEn} (ID: ${genMemberId})`, 
        ipAddress: req.ip || '127.0.0.1' 
      });
    }

    res.status(201).json({ success: true, data: newMember });
  } catch (error) { next(error); }
};

// সদস্য তথ্য এডিট
exports.updateMember = async (req, res, next) => {
  try {
    let member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found.' });

    // ইমেজ ফিল্ড নেমিং ম্যাচিং
    if (req.body.nidPhoto) {
      req.body.nidFront = req.body.nidFront || req.body.nidPhoto;
    }
    if (req.body.degreePhoto) {
      req.body.degreeCertificate = req.body.degreeCertificate || req.body.degreePhoto;
    }

    if (req.body.profilePhoto && req.body.profilePhoto.startsWith('data:')) {
      req.body.profilePhoto = await uploadFile(req.body.profilePhoto, 'profiles');
    }
    if (req.body.nidFront && req.body.nidFront.startsWith('data:')) {
      req.body.nidFront = await uploadFile(req.body.nidFront, 'documents');
    }
    if (req.body.nidBack && req.body.nidBack.startsWith('data:')) {
      req.body.nidBack = await uploadFile(req.body.nidBack, 'documents');
    }
    if (req.body.degreeCertificate && req.body.degreeCertificate.startsWith('data:')) {
      req.body.degreeCertificate = await uploadFile(req.body.degreeCertificate, 'documents');
    }

    req.body.updatedBy = req.user._id;
    member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await ActivityLog.create({ user: req.user._id, action: 'Update Member', details: `Updated details of ID: ${member.memberId}`, ipAddress: req.ip || '127.0.0.1' });
    res.status(200).json({ success: true, data: member });
  } catch (error) { next(error); }
};

// সদস্য ডিলিট
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    await Member.findByIdAndDelete(req.params.id);
    await ActivityLog.create({ user: req.user._id, action: 'Delete Member', details: `Deleted ${member.nameEn} (ID: ${member.memberId})`, ipAddress: req.ip || '127.0.0.1' });
    res.status(200).json({ success: true, message: 'Member profile deleted.' });
  } catch (error) { next(error); }
};

// ডাটাবেজ থেকে ফিল্টারিং ও সার্চিং তালিকা
exports.getMembers = async (req, res, next) => {
  try {
    const { search, qualification, upazila, status, roleType, sort } = req.query;
    let queryObj = {};

    if (search) {
      queryObj.$or = [
        { nameEn: { $regex: search, $options: 'i' } },
        { nameBn: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (qualification) queryObj.qualification = { $regex: qualification, $options: 'i' };
    if (upazila) queryObj.upazila = { $regex: upazila, $options: 'i' };
    if (status) queryObj.status = status;
    if (roleType) queryObj.roleType = roleType;

    let query = Member.find(queryObj);
    if (sort === 'oldest') query = query.sort({ createdAt: 1 });
    else if (sort === 'alpha') query = query.sort({ nameEn: 1 });
    else if (sort === 'executive') query = query.sort({ executiveOrder: 1 });
    else query = query.sort({ createdAt: -1 });

    const members = await query.exec();
    res.status(200).json({ success: true, results: members.length, data: members });
  } catch (error) { next(error); }
};

// পাবলিক প্রোফাইল প্রিভিউ (সিকিউরড ডকুমেন্ট হাইড রাখা)
exports.getPublicProfile = async (req, res, next) => {
  try {
    const member = await Member.findOne({ slug: req.params.slug })
      .select('-nidNumber -nidFront -nidBack -degreeCertificate -additionalDocs -privateNotes -createdBy -updatedBy');
    if (!member) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.status(200).json({ success: true, data: member });
  } catch (error) { next(error); }
};

// কিউআর কোড স্ক্যান বা ভেরিফিকেশন পোর্টাল কুয়েরি
exports.verifyMemberLookup = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, message: 'Query string missing.' });

    const member = await Member.findOne({ $or: [{ memberId: query.trim() }, { phone: query.trim() }] })
      .select('nameEn nameBn memberId status qualification profilePhoto joiningDate qrCode');
    if (!member) return res.status(404).json({ success: false, verified: false, message: 'No record found.' });

    res.status(200).json({ success: true, verified: true, verificationDate: new Date(), data: member });
  } catch (error) { next(error); }
};

// মেম্বারদের সিএসভি এক্সপোর্ট
exports.exportMembersCSV = async (req, res, next) => {
  try {
    const members = await Member.find().sort({ memberId: 1 });
    let csv = 'Membership ID,Full Name (En),Full Name (Bn),Phone,Email,Qualification,Status,Chamber\n';
    members.forEach(m => {
      csv += `"${m.memberId}","${m.nameEn}","${m.nameBn}","${m.phone}","${m.email || ''}","${m.qualification}","${m.status}","${m.chamberName || ''}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bddpa-members.csv');
    res.status(200).send(csv);
  } catch (error) { next(error); }
};
