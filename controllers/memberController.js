const Member = require('../models/Member');
const Counter = require('../models/Counter');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');

// ==================== HELPER: File Upload ====================
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

// ==================== CREATE MEMBER (Public + Admin) ====================
exports.createMember = async (req, res, next) => {
  try {
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

    // Upload Images
    const profilePhoto = await uploadFile(req.body.profilePhoto, 'profiles');
    const nidFront = await uploadFile(req.body.nidFront, 'documents');
    const nidBack = await uploadFile(req.body.nidBack, 'documents');
    const degreeCertificate = await uploadFile(req.body.degreeCertificate, 'documents');

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
      // Admin creating member
      memberData.createdBy = req.user._id;
      memberData.status = memberData.status || 'Active';
      memberData.roleType = memberData.roleType || 'General Member';
      memberData.joiningDate = memberData.joiningDate || new Date().toISOString();
    } else {
      // Public registration
      memberData.status = 'Pending';
      memberData.roleType = 'General Member';
      memberData.executivePost = '';
      memberData.joiningDate = new Date().toISOString();
    }

    const newMember = await Member.create(memberData);

    // Generate QR Code
    const publicUrl = `${process.env.FRONTEND_URL || 'https://bddpa-bhola.vercel.app'}/#/members/${uniqueSlug}`;
    newMember.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`;
    await newMember.save();

    // Activity Log (with error handling)
    try {
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
          details: `Pending application from ${newMember.nameEn} (ID: ${genMemberId})`,
          ipAddress: req.ip || '127.0.0.1'
        });
      }
    } catch (logErr) {
      console.warn('Activity log failed:', logErr.message);
    }

    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    console.error('Create Member Error:', error);
    next(error);
  }
};

// ==================== UPDATE MEMBER ====================
exports.updateMember = async (req, res, next) => {
  try {
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

    // Upload new images if provided
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
    console.error('Update Member Error:', error);
    next(error);
  }
};

// ==================== DELETE MEMBER ====================
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    await Member.findByIdAndDelete(req.params.id);
    await ActivityLog.create({
      user: req.user._id,
      action: 'Delete Member',
      details: `Deleted ${member.nameEn} (ID: ${member.memberId})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(200).json({ success: true, message: 'Member profile deleted.' });
  } catch (error) {
    console.error('Delete Member Error:', error);
    next(error);
  }
};

// ==================== GET MEMBERS (with filters) ====================
exports.getMembers = async (req, res, next) => {
  try {
    const { search, qualification, upazila, status, roleType, sort, limit = 50 } = req.query;
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

    if (limit) query = query.limit(parseInt(limit));

    const members = await query.exec();
    res.status(200).json({ success: true, results: members.length, data: members });
  } catch (error) {
    console.error('Get Members Error:', error);
    next(error);
  }
};

// ==================== GET PUBLIC PROFILE ====================
exports.getPublicProfile = async (req, res, next) => {
  try {
    const member = await Member.findOne({ slug: req.params.slug })
      .select('-nidNumber -nidFront -nidBack -degreeCertificate -privateNotes -createdBy -updatedBy');
    
    if (!member) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    console.error('Get Public Profile Error:', error);
    next(error);
  }
};

// ==================== VERIFY MEMBER ====================
exports.verifyMemberLookup = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query string missing.' });
    }

    const member = await Member.findOne({
      $or: [
        { memberId: query.trim() },
        { phone: query.trim() }
      ]
    }).select('nameEn nameBn memberId status qualification profilePhoto joiningDate qrCode');

    if (!member) {
      return res.status(404).json({ 
        success: false, 
        verified: false, 
        message: 'No record found.' 
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      verificationDate: new Date(),
      data: member
    });
  } catch (error) {
    console.error('Verify Member Error:', error);
    next(error);
  }
};

// ==================== EXPORT CSV ====================
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
  } catch (error) {
    console.error('Export CSV Error:', error);
    next(error);
  }
};
