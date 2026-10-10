/**
 * RASH EduHub — Backend Server
 * Node.js + Express + Supabase Database REST API
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody } = require('./middleware/validator');
const supabase = require('./supabaseClient');

const app = express();

// --------------- Security & Core Middleware ---------------
app.use(cors());

// Basic Security Headers
app.use((req, res, next) => {
   res.setHeader('X-Content-Type-Options', 'nosniff');
   res.setHeader('X-Frame-Options', 'SAMEORIGIN');
   res.setHeader('X-XSS-Protection', '1; mode=block');
   next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sanitizeBody);
app.use(morgan('dev'));

// --------------- Uptime Robot & Health Check Endpoints ---------------
// Ultra-fast ping endpoints placed before rate limiting (perfect for Uptime Robot & Render Keep-Alive)
app.get('/ping', (req, res) => res.status(200).send('OK'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// Apply global API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Serve uploaded files statically
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Serve frontend static files (images, css, js) with no-cache for scripts
app.use(express.static(path.join(__dirname, '..'), {
   setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
         res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
   }
}));

// --------------- API Routes ---------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/code', require('./routes/code'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/ai', require('./routes/ai-proxy'));

// Direct friendly route redirects for courses & instructors
app.get('/instructors/:instructorId/courses', (req, res) => {
   res.redirect(`/teacher_profile.html?teacherId=${encodeURIComponent(req.params.instructorId)}`);
});
app.get('/courses/:courseId/notes', (req, res) => {
   res.redirect(`/student/notes.html?courseId=${encodeURIComponent(req.params.courseId)}`);
});
app.get('/courses/:courseId', (req, res) => {
   res.redirect(`/playlist.html?courseId=${encodeURIComponent(req.params.courseId)}`);
});

// Advanced Platform Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/activity', require('./routes/activityLog'));

// Health check
app.get('/api/health', (req, res) => {
   res.json({
      status: 'ok',
      message: 'RASH EduHub API is running with Supabase Cloud Database',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
   });
});

// Serve frontend index.html for non-API routes
app.get('*', (req, res) => {
   if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'index.html'));
   }
});

// Global error handler
app.use(errorHandler);

// --------------- Database & Server Start ---------------
const PORT = process.env.PORT || 5000;

console.log('⚡ Initializing RASH EduHub Supabase Database connection...');
if (require.main === module) {
   app.listen(PORT, () => {
      console.log(`🚀 RASH EduHub Server running on http://localhost:${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`☁️ Supabase Cloud Database connected.`);
   });
}

module.exports = app;
