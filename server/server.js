/**
 * Construction Site Management System — Server Entry Point
 *
 * Express 5 application with MongoDB connection, security middleware,
 * and all API route mounts.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// ============================================
// Global Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS — explicitly reflect the requesting origin to fix Vercel CORS issues
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting on auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CSMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Auth routes (with rate limiting)
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));

// Site routes
app.use('/api/sites', require('./routes/siteRoutes'));

// Supplier routes (global — not site-scoped)
app.use('/api/suppliers', require('./routes/supplierRoutes'));

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
});

// ============================================
// Error Handler (must be last)
// ============================================
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🏗️  CSMS Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
