const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');
const User = require('../models/User.js');
const Thread = require('../models/Thread.js');
const Post = require('../models/Post.js');
const Upload = require('../models/Upload.js');
const { protect, optionalAuth } = require('../middleware/auth.js');

const router = express.Router();

// For CommonJS, __dirname and __filename are already available

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const dateDir = path.join(uploadDir, year, month, day);
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    cb(null, dateDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|zip|rar|7z|doc|docx|xls|xlsx|txt|md|epub|apk/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) ||
                   file.mimetype.startsWith('image/') ||
                   file.mimetype.startsWith('application/') ||
                   file.mimetype.startsWith('text/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter
});

router.post('/', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploads = [];
    let totalSize = 0;

    const existingUploads = await Upload.find({ user: req.user._id });
    const currentStorage = existingUploads.reduce((sum, u) => sum + u.size, 0);
    const storageLimit = req.user.role === 'admin' ? 1024 * 1024 * 1024 :
                         req.user.role === 'moderator' ? 512 * 1024 * 1024 :
                         100 * 1024 * 1024;

    for (const file of req.files) {
      totalSize += file.size;
    }

    if (currentStorage + totalSize > storageLimit) {
      req.files.forEach(file => fs.unlink(file.path, () => {}));
      return res.status(400).json({
        success: false,
        message: `Storage limit exceeded. ${formatBytes(currentStorage)} of ${formatBytes(storageLimit)} used.`
      });
    }

    for (const file of req.files) {
      const upload = new Upload({
        user: req.user._id,
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
        status: 'active'
      });
      await upload.save();
      uploads.push(upload);
    }

    res.json({
      success: true,
      message: `${uploads.length} file(s) uploaded`,
      data: {
        uploads: uploads.map(u => ({ _id: u._id, originalName: u.originalName, url: u.url, size: u.size, mimeType: u.mimeType })),
        urls: uploads.map(u => u.url)
      }
    });
  } catch (error) {
    if (req.files) req.files.forEach(file => fs.unlink(file.path, () => {}));
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { filter = 'all', sort = 'newest', page = 1, limit = 20 } = req.query;
    let query = { user: req.user._id };
    
    if (filter === 'images') query.mimeType = { $regex: '^image/' };
    else if (filter === 'documents') query.mimeType = { $regex: '^(application/pdf|application/msword|application/vnd.openxmlformats)' };
    else if (filter === 'archives') query.mimeType = { $regex: '(zip|rar|7z)' };

    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'largest') sortOption = { size: -1 };
    else if (sort === 'smallest') sortOption = { size: 1 };

    const uploads = await Upload.find(query).sort(sortOption)
      .limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit))
      .populate('thread', 'title slug').populate('post', 'content');

    const total = await Upload.countDocuments(query);
    const storageStats = await Upload.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);

    const storageUsed = storageStats.length > 0 ? storageStats[0].totalSize : 0;
    const storageLimit = req.user.role === 'admin' ? 1024 * 1024 * 1024 :
                         req.user.role === 'moderator' ? 512 * 1024 * 1024 :
                         100 * 1024 * 1024;

    res.json({
      success: true,
      data: { uploads, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), storageUsed, storageLimit }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch uploads' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id });
    if (!upload) return res.status(404).json({ success: false, message: 'Upload not found' });

    fs.unlink(upload.path, () => {});
    await Upload.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete upload' });
  }
});

router.get('/stats/summary', protect, async (req, res) => {
  try {
    const stats = await Upload.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        images: { $sum: { $cond: [{ $regexMatch: { input: '$mimeType', regex: '^image/' } }, 1, 0] } },
        documents: { $sum: { $cond: [{ $regexMatch: { input: '$mimeType', regex: '^(application/pdf|application/msword)' } }, 1, 0] } },
        archives: { $sum: { $cond: [{ $regexMatch: { input: '$mimeType', regex: '(zip|rar|7z)' } }, 1, 0] } }
      }}
    ]);

    const storageLimit = req.user.role === 'admin' ? 1024 * 1024 * 1024 :
                         req.user.role === 'moderator' ? 512 * 1024 * 1024 :
                         100 * 1024 * 1024;

    res.json({
      success: true,
      data: {
        totalFiles: stats[0]?.totalFiles || 0,
        totalSize: stats[0]?.totalSize || 0,
        images: stats[0]?.images || 0,
        documents: stats[0]?.documents || 0,
        archives: stats[0]?.archives || 0,
        storageLimit,
        usagePercentage: stats[0] ? (stats[0].totalSize / storageLimit) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

module.exports = router;
