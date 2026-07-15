const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  nameEn: { type: String, required: [true, 'English spelling is mandatory'], trim: true },
  nameBn: { type: String, required: [true, 'Bangla spelling is mandatory'], trim: true },
  memberId: { type: String, unique: true, sparse: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  profilePhoto: { type: String, default: '' },
  phone: { type: String, required: [true, 'Phone number is mandatory'], unique: true, trim: true },
  alternatePhone: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  biography: { type: String, default: '', trim: true },
  socialLinks: {
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  website: { type: String, default: '', trim: true },
  fatherName: { type: String, default: '', trim: true },
  motherName: { type: String, default: '', trim: true },
  dob: { type: Date },
  bloodGroup: { type: String, enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: '' },
  gender: { type: String, enum: ['', 'Male', 'Female', 'Other'], default: '' },
  address: { type: String, default: '', trim: true },
  upazila: { type: String, default: '', trim: true },
  district: { type: String, default: 'Bhola', trim: true },
  chamberName: { type: String, default: '', trim: true },
  chamberAddress: { type: String, default: '', trim: true },
  qualification: { type: String, required: [true, 'Qualification is required'], trim: true },
  institution: { type: String, default: '', trim: true },
  experience: { type: Number, default: 0 },
  bmdcReg: { type: String, required: [true, 'BMDC Registration number is required'], trim: true },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive', 'Suspended', 'Expired'], default: 'Active' },
  roleType: { type: String, enum: ['Executive Committee', 'General Member'], default: 'General Member' },
  executivePost: { type: String, default: '' },
  executiveOrder: { type: Number, default: 99 },
  qrCode: { type: String, default: '' },
  nidNumber: { type: String, default: '', trim: true },
  nidFront: { type: String, default: '' },
  nidBack: { type: String, default: '' },
  degreeCertificate: { type: String, default: '' },
  additionalDocs: { type: String, default: '' },
  privateNotes: { type: String, default: '', trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

memberSchema.index({ memberId: 1, slug: 1, phone: 1, upazila: 1 });
module.exports = mongoose.model('Member', memberSchema);