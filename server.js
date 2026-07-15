require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');

const connectDatabase = require('./config/db');
const { sanitizePayloads } = require('./middlewares/security');
const { apiRateLimiter } = require('./middlewares/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/error');
const apiRouter = require('./routes/api');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://apis.google.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://res.cloudinary.com", "https://api.qrserver.com"],
      connectSrc: ["'self'", "https://oauth2.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : true,
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizePayloads());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ডেটাবেজ কানেকশন ইনিশিয়ালাইজ করা
connectDatabase();

app.use('/api', apiRateLimiter);
app.use('/api/v1', apiRouter);

// ফ্রন্টএন্ড স্ট্যাটিক ফাইল সার্ভ করার লজিক (প্রয়োজন না হলে SERVE_FRONTEND=false করে রাখবেন)
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendDir = path.resolve(__dirname, '..', 'frontend');
  app.use(express.static(frontendDir, { maxAge: '1h', index: 'index.html' }));

  // Hash-routing হ্যান্ডেলার
  app.get(/^\/(?!api\/).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
} else {
  // বেসিক রুট রেসপন্স (API চ্যাকিংয়ের জন্য)
  app.get('/', (req, res) => {
    res.json({ message: 'BDDPA Backend API is running successfully' });
  });
}

app.use(notFoundHandler);
app.use(globalErrorHandler);

const seedDataIfEmpty = async () => {
  const Notice = require('./models/Notice');
  const Counter = require('./models/Counter');
  const HomeContent = require('./models/HomeContent');
  const User = require('./models/User');

  try {
    const memberCounter = await Counter.findOne({ id: 'memberId' });
    if (!memberCounter) await Counter.create({ id: 'memberId', seq: 0 });

    const noticesCount = await Notice.countDocuments();
    if (noticesCount === 0) {
      await Notice.create([
        {
          title: 'ভোলার নতুন ডেন্টাল প্র্যাকটিশনারদের সদস্যপদ আবেদন কার্যক্রম ২০২৬',
          content: 'অ্যাসোসিয়েশনের নতুন সদস্যপদ প্রদান সংক্রান্ত বিশেষ বিজ্ঞপ্তি। আবেদন শুরু হচ্ছে আগামী ১৫ জুলাই থেকে।',
          category: 'General'
        }
      ]);
    }

    const homeConfig = await HomeContent.findOne({ key: 'homepage' });
    if (!homeConfig) await HomeContent.create({ key: 'homepage' });

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const existing = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!existing) {
        const hashed = await bcrypt.hash(adminPassword, 12);
        await User.create({
          name: process.env.SEED_ADMIN_NAME || 'Super Admin',
          email: adminEmail.toLowerCase(),
          password: hashed,
          role: 'Super Admin',
          isActive: true
        });
        console.log(`Seeded Super Admin: ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error('Auto seeder issues:', err);
  }
};

// Render-এ সচল থাকার জন্য পোর্ট অবধারিতভাবে লিসেন করতে হবে
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  seedDataIfEmpty();
  console.log(`BDDPA API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ভবিষ্যতের স্কেলিং বা অন্য সার্ভারলেস প্ল্যাটফর্মের সামঞ্জস্যতার জন্য এক্সপোর্ট রাখা হলো
module.exports = app;
