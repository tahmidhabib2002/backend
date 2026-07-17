const Member = require('../models/Member');
const Counter = require('../models/Counter');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');

// ==================== HELPER: File Upload (Improved) ====================
const uploadFile = async (base64Str, folderName) => {
  // খালি বা invalid ডাটা চেক
  if (!base64Str || typeof base64Str !== 'string') {
    console.log(`⚠️ No valid file for ${folderName}`);
    return '';
  }
  
  // শুধুমাত্র data:image/ বা data:application/ দিয়ে শুরু হয় কিনা চেক
  if (!base64Str.startsWith('data:image/') && !base64Str.startsWith('data:application/')) {
    console.log(`⚠️ Invalid base64 format for ${folderName}, length: ${base64Str.length}`);
    return '';
  }

  // ফাইল সাইজ চেক (আনুমানিক 10MB এর বেশি হলে warning)
  const approximateSize = base64Str.length * 0.75; // base64 থেকে আসল সাইজ
  if (approximateSize > 10 * 1024 * 1024) {
    console.warn(`⚠️ File size too large for ${folderName}: ${Math.round(approximateSize/1024/1024)}MB`);
    // 10MB এর বেশি হলে resize করে আপলোড করুন
  }

  try {
    console.log(`📤 Uploading to Cloudinary: ${folderName}, size: ${Math.round(approximateSize/1024)}KB`);
    
    const uploadRes = await cloudinary.uploader.upload(base64Str, {
      folder: `bddpa/${folderName}`,
      transformation: [
        { width: 1200, crop: "limit", quality: "auto:good" }
      ],
      timeout: 60000 // 60 সেকেন্ড টাইমআউট
    });
    
    console.log(`✅ Upload successful: ${uploadRes.secure_url}`);
    return uploadRes.secure_url;
  } catch (err) {
    console.error(`❌ Cloudinary upload error for ${folderName}:`, err.message);
    console.error('Error details:', err);
    
    // নির্দিষ্ট error টাইপ চেক
    if (err.message?.includes('File size too large')) {
      console.error('⚠️ File is too large for Cloudinary (max 10MB for free tier)');
    } else if (err.message?.includes('invalid signature')) {
      console.error('⚠️ Cloudinary API keys may be incorrect');
    } else if (err.message?.includes('network')) {
      console.error('⚠️ Network error - check internet connection');
    }
    
    return ''; // খালি রিটার্ন করলেও error লগ থাকবে
  }
};

// ==================== CREATE MEMBER (Public + Admin) ====================
exports.createMember = async (req, res, next) => {
  try {
    console.log('📥 === CREATE MEMBER REQUEST ===');
    console.log('📌 Body keys:', Object.keys(req.body));
    console.log('📌 Phone:', req.body.phone);
    console.log('📌 Has profilePhoto?', !!req.body.profilePhoto);
    console.log('📌 Has degreePhoto?', !!req.body.degreePhoto);
    console.log('📌 Has nidPhoto?', !!req.body.nidPhoto);

    // Check if phone already exists
    const existingPhone = await Member.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'এই মোবাইল নম্বরটি ইতিমধ্যে রেজিস্টার্ড।'
      });
    }

    // Normalize image fields
    if (req.body.nidPhoto) {
      req.body.nidFront = req.body.nidFront || req.body.nidPhoto;
    }
    if (req.body.degreePhoto) {
      req.body.degreeCertificate = req.body.degreeCertificate || req.body.degreePhoto;
    }

    // Generate Member ID
    const counter = await Counter.findOneAndUpdate(
      { id: 'memberId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqStr = String(counter.seq).padStart(4, '0');
    const genMemberId = `BDPA-${seqStr}`;

    // Generate Slug
    let baseSlug = (req.body.nameEn || 'member')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');

    if (!baseSlug) baseSlug = `member-${Date.now()}`;

    let uniqueSlug = baseSlug;
    let slugExists = await Member.findOne({ slug: uniqueSlug });
    let suffix = 1;
    while (slugExists) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      slugExists = await Member.findOne({ slug: uniqueSlug });
      suffix++;
    }

    console.log('📤 Uploading images to Cloudinary...');

    // Upload Images (এখন error log দেখাবে)
    const [profilePhoto, nidFront, nidBack, degreeCertificate] = await Promise.all([
      uploadFile(req.body.profilePhoto, 'profiles'),
      uploadFile(req.body.nidFront, 'documents'),
      uploadFile(req.body.nidBack, 'documents'),
      uploadFile(req.body.degreeCertificate, 'documents')
    ]);

    console.log('📸 Upload results:', {
      profilePhoto: !!profilePhoto,
      nidFront: !!nidFront,
      nidBack: !!nidBack,
      degreeCertificate: !!degreeCertificate
    });

    // Prepare member data
    const memberData = {
      ...req.body,
      memberId: genMemberId,
      slug: uniqueSlug,
      profilePhoto,
      nidFront,
      nidBack,
      degreeCertificate
    };

    // Set status based on who is creating
    if (req.user) {
      memberData.createdBy = req.user._id;
      memberData.status = memberData.status || 'Active';
      memberData.roleType = memberData.roleType || 'General Member';
      memberData.joiningDate = memberData.joiningDate || new Date().toISOString();
    } else {
      memberData.status = 'Pending';
      memberData.roleType = 'General Member';
      memberData.executivePost = '';
      memberData.joiningDate = new Date().toISOString();
    }

    const newMember = await Member.create(memberData);
    console.log('✅ Member created:', newMember._id);

    // Generate QR Code (এখানে error হলে সেটা ignore করবে)
    try {
      const publicUrl = `${process.env.FRONTEND_URL || 'https://bddpa-bhola.vercel.app'}/#/members/${uniqueSlug}`;
      newMember.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`;
      await newMember.save();
    } catch (qrErr) {
      console.warn('⚠️ QR Code generation failed:', qrErr.message);
    }

    // Activity Log
    try {
      const logData = {
        action: req.user ? 'Create Member' : 'Public Registration Request',
        details: `${newMember.nameEn} (ID: ${genMemberId})`,
        ipAddress: req.ip || '127.0.0.1'
      };
      if (req.user) logData.user = req.user._id;
      await ActivityLog.create(logData);
    } catch (logErr) {
      console.warn('⚠️ Activity log failed:', logErr.message);
    }

    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    console.error('❌ Create Member Error:', error);
    console.error('Stack:', error.stack);
    next(error);
  }
};

// ==================== UPDATE MEMBER ====================
exports.updateMember = async (req, res, next) => {
  try {
    console.log('📥 === UPDATE MEMBER REQUEST ===', req.params.id);
    
    let member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }

    // Normalize image fields
    if (req.body.nidPhoto) {
      req.body.nidFront = req.body.nidFront || req.body.nidPhoto;
    }
    if (req.body.degreePhoto) {
      req.body.degreeCertificate = req.body.degreeCertificate || req.body.degreePhoto;
    }

    // Upload new images if provided (শুধু base64 স্ট্রিং থাকলেই আপলোড করবে)
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
    member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Member',
      details: `Updated details of ID: ${member.memberId}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    console.error('❌ Update Member Error:', error);
    next(error);
  }
};

// ... (বাকি ফাংশনগুলি আগের মতোই থাকবে)
