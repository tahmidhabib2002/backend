exports.validateMemberInput = (req, res, next) => {
  const { nameEn, nameBn, phone, qualification, bmdcReg } = req.body;
  if (!nameEn || !nameBn || !phone || !qualification || !bmdcReg) {
    return res.status(400).json({ success: false, message: 'Missing mandatory fields' });
  }
  next();
};