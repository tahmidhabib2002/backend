const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: { type: String, unique: true, required: true },
  slug: { type: String, unique: true, required: true },
  
  // Personal Info
  nameBn: { type: String, required: true },
  nameEn: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  bloodGroup: { type: String },
  nidNumber: { type: String },
  personalAddress: { type: String },
  
  // Professional Info
  qualification: { type: String, required: true },
  institution: { type: String },
  bmdcReg: { type: String },
  experience: { type: Number, default: 0 },
  
  // Chamber Info
  chamberName: { type: String },
  chamberAddress: { type: String },
  upazila: { type: String, required: true },
  
  // Photos (Store Cloudinary URLs)
  profilePhoto: { type: String },
  nidFront: { type: String },
  nidBack: { type: String },
  degreeCertificate: { type: String },
  
  // Legacy fields for backward compatibility
  nidPhoto: { type: String },
  degreePhoto: { type: String },
  
  // Status & Role
  status: { type: String, enum: ['Pending', 'Active', 'Inactive'], default: 'Pending' },
  roleType: { type: String, enum: ['General Member', 'Executive Committee'], default: 'General Member' },
  executivePost: { type: String },
  executiveOrder: { type: Number, default: 0 },
  
  // Dates
  joiningDate: { type: Date, default: Date.now },
  qrCode: { type: String },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  privateNotes: { type: String }
}, { timestamps: true });

// Indexes for search
memberSchema.index({ nameEn: 'text', nameBn: 'text', memberId: 'text', phone: 'text' });

module.exports = mongoose.model('Member', memberSchema);
