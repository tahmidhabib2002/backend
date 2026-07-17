const { body, validationResult } = require('express-validator');

exports.validateMemberInput = [
  body('nameBn').notEmpty().withMessage('নাম (বাংলা) প্রয়োজন'),
  body('nameEn').notEmpty().withMessage('নাম (ইংরেজি) প্রয়োজন'),
  body('phone').notEmpty().withMessage('মোবাইল নম্বর প্রয়োজন'),
  body('qualification').notEmpty().withMessage('যোগ্যতা প্রয়োজন'),
  body('upazila').notEmpty().withMessage('উপজেলা প্রয়োজন'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
