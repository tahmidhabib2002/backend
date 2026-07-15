const compileTemplate = (title, preheader, bodyContent, buttonText = '', buttonUrl = '') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .main { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .header { background-color: #0c4a6e; color: #ffffff; padding: 32px 24px; text-align: center; }
        .content { padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6; }
        .btn-holder { text-align: center; margin: 24px 0; }
        .btn { background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; }
        .footer { background-color: #f1f5f9; text-align: center; padding: 16px; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="main">
        <div class="header">
          <h1 style="margin:0; font-size: 20px;">${title}</h1>
          <p style="margin:5px 0 0 0; font-size:12px; color:#38bdf8;">${preheader}</p>
        </div>
        <div class="content">
          ${bodyContent}
          ${buttonText && buttonUrl ? `<div class="btn-holder"><a href="${buttonUrl}" class="btn">${buttonText}</a></div>` : ''}
        </div>
        <div class="footer">© ২০২৬ BDDPA ভোলা। এটি একটি অফিসিয়াল কেন্দ্রীয় নোটিফিকেশন।</div>
      </div>
    </body>
    </html>
  `;
};

exports.getVerificationEmail = (name, id, verifyUrl) => {
  return compileTemplate(
    'মেম্বারশিপ ভেরিফিকেশন',
    'ডিজিটাল ডিরেক্টরি অনুমোদন বার্তা',
    `प्रिय ${name},<br><br>ভোলা জেলা ডেন্টাল প্র্যাকটিশনার অ্যাসোসিয়েশনের অনলাইন ডিরেক্টরিতে আপনার তথ্য সফলভাবে তালিকাভুক্ত করা হয়েছে। আপনার মেম্বারশিপ আইডি: <strong>${id}</strong>।`,
    'ডিজিটাল প্রোফাইল দেখুন',
    verifyUrl
  );
};

exports.getPasswordResetEmail = (resetUrl) => {
  return compileTemplate(
    'পাসওয়ার্ড পরিবর্তনের অনুরোধ',
    'নিরাপত্তা সতর্কতা',
    'আপনার অ্যাসোসিয়েশন অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করার অনুরোধ পাওয়া গেছে। পাসওয়ার্ড পরিবর্তন করতে নিচের বাটনে ক্লিক করুন।',
    'পাসওয়ার্ড রিসেট করুন',
    resetUrl
  );
};