const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { uploadFile, uploadScreenshot } = require('../middleware/upload');

// @route   POST /api/uploads/file
// @desc    Upload file attachment
// @access  Private
router.post('/file', protect, uploadFile.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/files/${req.file.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/uploads/screenshot
// @desc    Upload screenshot/image
// @access  Private
router.post('/screenshot', protect, uploadScreenshot.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: `/uploads/thumbnails/${req.file.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/uploads/download/:filename
// @desc    Download file
// @access  Public
router.get('/download/:filename', async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', 'files', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
