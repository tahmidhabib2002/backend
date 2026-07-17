const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ============ CORS Configuration ============
app.use(cors({
  origin: ['http://localhost:5500', 'http://localhost:3000', 'https://bddpa-bhola.vercel.app', 'https://*.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============ Body Parser ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ Static Files ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ Routes ============
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/members', require('./routes/memberRoutes'));
app.use('/api/v1/notices', require('./routes/noticeRoutes'));
app.use('/api/v1/cms', require('./routes/cmsRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// ============ DIRECT APPLY ROUTE (জন্য পাবলিক রেজিস্ট্রেশন) ============
const memberController = require('./controllers/memberController');
app.post('/api/v1/apply', memberController.createMember);

// ============ Health Check ============
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============ Error Handler ============
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ============ Database Connection ============
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
