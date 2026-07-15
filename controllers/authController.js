const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
};

const sendAuthResponse = async (user, statusCode, req, res, logAction = 'Login') => {
  const token = generateToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.COOKIE_EXPIRE || '1', 10) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('accessToken', token, cookieOptions);

  await ActivityLog.create({
    user: user._id,
    action: logAction,
    details: `${user.email} successfully completed session handshakes.`,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown Browser'
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({ success: false, message: `Account locked. Retry in ${remainingMinutes} minutes.` });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 60 * 60 * 1000;
      }
      await user.save();
      return res.status(401).json({ success: false, message: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.` });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await sendAuthResponse(user, 200, req, res, 'Login (Credentials)');
  } catch (error) { next(error); }
};

exports.googleLogin = async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: 'OAuth Token missing.' });

  try {
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const payload = await googleResponse.json();
    if (payload.error_description) return res.status(400).json({ success: false, message: 'OAuth verification failed.' });

    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ name, email, googleId, role: 'Editor', isActive: true });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    await sendAuthResponse(user, 200, req, res, 'Login (Google OAuth)');
  } catch (error) { next(error); }
};

exports.getCurrentUser = async (req, res) => {
  res.status(200).json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await ActivityLog.create({ user: req.user._id, action: 'Logout', details: 'Logged out successfully.', ipAddress: req.ip || '127.0.0.1' });
    }
    res.cookie('accessToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) { next(error); }
};