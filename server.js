const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ============ Dynamic CORS Configuration ============
const allowedOrigins = [
  'http://localhost:5500',
  'http://localhost:3000',
  'https://bddpa-bhola.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
    const isVercelSubdomain = /\.vercel\.app$/.test(origin); // এটি যেকোনো .vercel.app লিংক হ্যান্ডেল করবে
    
    if (isAllowed || isVercelSubdomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/members', require('./routes/members'));
app.use('/api/v1/notices', require('./routes/notices'));
app.use('/api/v1/cms', require('./routes/cms'));
app.use('/api/v1/admin', require('./routes/admin'));

// ============ Direct Apply Route (Backup for Frontend) ============
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
