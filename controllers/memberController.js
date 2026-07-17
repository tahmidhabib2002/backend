// ফাইল আপলোড ও স্লাগ জেনারেশন ইত্যাদি আগের মতোই থাকবে
// শুধু createMember ফাংশনে নিচের পরিবর্তনগুলো করুন

exports.createMember = async (req, res, next) => {
  try {
    const existingPhone = await Member.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'এই মোবাইল নম্বরটি ইতিমধ্যে রেজিস্টার্ড।' });
    }

    // ইমেজ ফিল্ড নরমালাইজেশন
    if (req.body.nidPhoto) req.body.nidFront = req.body.nidFront || req.body.nidPhoto;
    if (req.body.degreePhoto) req.body.degreeCertificate = req.body.degreeCertificate || req.body.degreePhoto;

    // মেম্বার আইডি জেনারেশন
    const counter = await Counter.findOneAndUpdate(
      { id: 'memberId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqStr = String(counter.seq).padStart(4, '0');
    const genMemberId = `BDPA-${seqStr}`;

    // স্লাগ জেনারেশন
    let baseSlug = (req.body.nameEn || 'member')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');
    let uniqueSlug = baseSlug;
    let slugExists = await Member.findOne({ slug: uniqueSlug });
    let suffix = 1;
    while (slugExists) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      slugExists = await Member.findOne({ slug: uniqueSlug });
      suffix++;
    }

    // ছবি আপলোড
    const profilePhoto = await uploadFile(req.body.profilePhoto, 'profiles');
    const nidFront = await uploadFile(req.body.nidFront, 'documents');
    const nidBack = await uploadFile(req.body.nidBack, 'documents');
    const degreeCertificate = await uploadFile(req.body.degreeCertificate, 'documents');

    // মেম্বার ডেটা তৈরি
    const memberData = {
      ...req.body,
      memberId: genMemberId,
      slug: uniqueSlug,
      profilePhoto,
      nidFront,
      nidBack,
      degreeCertificate
    };

    // 👇 পাবলিক আবেদন ও অ্যাডমিন তৈরি – আলাদা আচরণ
    if (req.user) {
      // অ্যাডমিন লগইন করে তৈরি করলে
      memberData.createdBy = req.user._id;
      memberData.status = memberData.status || 'Active';
      memberData.roleType = memberData.roleType || 'General Member';
      memberData.joiningDate = memberData.joiningDate || new Date().toISOString();
    } else {
      // পাবলিক ইউজার (আবেদনকারী)
      memberData.status = 'Pending';
      memberData.roleType = 'General Member';
      memberData.executivePost = '';
      memberData.joiningDate = new Date().toISOString();
    }

    const newMember = await Member.create(memberData);

    // QR কোড জেনারেশন
    const publicUrl = `${process.env.FRONTEND_URL || ''}/#/members/${uniqueSlug}`;
    newMember.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`;
    await newMember.save();

    // অ্যাক্টিভিটি লগ (ক্র্যাশ ছাড়া)
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
    next(error);
  }
};
