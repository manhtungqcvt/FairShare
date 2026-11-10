const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Tải biến môi trường
dotenv.config();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

const app = express();

// Middlewares: Tự động cho phép mọi domain Vercel, CLIENT_URL và localhost không bị chặn CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log request trong môi trường development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Root test endpoint cho Render
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'FairShare Backend API is running smoothly.',
    docs: '/api/health'
  });
});

// Health check endpoint cho Render & Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    health: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FairShare API',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/settlements', require('./routes/settlementRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Lỗi máy chủ:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ máy chủ'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 FairShare Backend Server đang chạy tại http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = { app, server };
