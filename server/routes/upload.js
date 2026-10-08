/**
 * Upload Routes — Video, PDF, and Avatar file uploads via Multer
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

// Configure upload directories
const uploadBase = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

const ensureDir = (dir) => {
   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage config for videos
const videoStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      const dir = path.join(uploadBase, 'videos');
      ensureDir(dir);
      cb(null, dir);
   },
   filename: (req, file, cb) => {
      const uniqueName = `vid_${Date.now()}_${Math.round(Math.random() * 1e4)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
   }
});

// Storage config for PDFs/documents
const pdfStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      const dir = path.join(uploadBase, 'documents');
      ensureDir(dir);
      cb(null, dir);
   },
   filename: (req, file, cb) => {
      const uniqueName = `doc_${Date.now()}_${Math.round(Math.random() * 1e4)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
   }
});

// Storage config for avatars
const avatarStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      const dir = path.join(uploadBase, 'avatars');
      ensureDir(dir);
      cb(null, dir);
   },
   filename: (req, file, cb) => {
      const uniqueName = `avatar_${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
   }
});

const uploadVideo = multer({
   storage: videoStorage,
   limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
   fileFilter: (req, file, cb) => {
      const allowed = /mp4|webm|ogg|mov/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype) || file.mimetype.startsWith('video/');
      if (ext || mime) return cb(null, true);
      cb(new Error('Only video files (MP4, WebM, OGG) are allowed.'));
   }
});

const uploadPdf = multer({
   storage: pdfStorage,
   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
   fileFilter: (req, file, cb) => {
      const allowed = /pdf|docx?|pptx?|zip/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      if (ext) return cb(null, true);
      cb(new Error('Only document files (PDF, DOCX, PPT, ZIP) are allowed.'));
   }
});

const uploadAvatar = multer({
   storage: avatarStorage,
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
   fileFilter: (req, file, cb) => {
      const allowed = /jpg|jpeg|png|gif|webp|svg/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = file.mimetype.startsWith('image/');
      if (ext || mime) return cb(null, true);
      cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed.'));
   }
});

// POST /api/upload/video — Upload a video file
router.post('/video', protect, uploadVideo.single('video'), (req, res) => {
   if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded.' });
   }

   const filePath = `uploads/videos/${req.file.filename}`;
   res.json({ success: true, filePath, filename: req.file.filename, originalName: req.file.originalname });
});

// POST /api/upload/pdf — Upload a PDF/document
router.post('/pdf', protect, uploadPdf.single('document'), (req, res) => {
   if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
   }

   const filePath = `uploads/documents/${req.file.filename}`;
   res.json({ success: true, filePath, filename: req.file.filename, originalName: req.file.originalname });
});

// POST /api/upload/avatar — Upload a profile avatar
router.post('/avatar', protect, uploadAvatar.single('avatar'), (req, res) => {
   if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
   }

   const filePath = `uploads/avatars/${req.file.filename}`;
   res.json({ success: true, filePath, filename: req.file.filename, originalName: req.file.originalname });
});

module.exports = router;
