const express = require('express');
const router = express.Router();
const { protect, moderatorOnly } = require('../middleware/auth');
const Report = require('../models/Report');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const User = require('../models/User');
const { body, param, validationResult } = require('express-validator');

// Validation middleware for creating reports
const validateReport = [
  body('type')
    .trim()
    .notEmpty().withMessage('Report type is required')
    .isIn(['thread', 'post', 'user']).withMessage('Invalid report type'),
  body('targetId')
    .trim()
    .notEmpty().withMessage('Target ID is required'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isIn(['spam', 'abuse', 'copyright', 'wrong_section', 'other']).withMessage('Invalid reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }
    next();
  }
];

// @route   GET /api/reports
// @desc    Get all reports (Moderator only)
// @access  Moderator
router.get('/', moderatorOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'username avatar role')
      .populate('resolvedBy', 'username avatar role')
      .populate('target.thread', 'title slug')
      .populate('target.post', 'content')
      .populate('target.user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report (Moderator only)
// @access  Moderator
router.get('/:id', moderatorOnly, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'username avatar role reputation')
      .populate('resolvedBy', 'username avatar role')
      .populate('target.thread')
      .populate('target.post')
      .populate('target.user');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', protect, validateReport, async (req, res, next) => {
  try {
    const { type, targetId, reason, description } = req.body;

    // Verify target exists
    let target = {};
    if (type === 'thread') {
      const thread = await Thread.findById(targetId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }
      target.thread = targetId;
    } else if (type === 'post') {
      const post = await Post.findById(targetId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      target.post = targetId;
    } else if (type === 'user') {
      const user = await User.findById(targetId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      target.user = targetId;
    }

    // Check if user already reported this
    const existingReport = await Report.findOne({
      reporter: req.user.id,
      type,
      ...target,
      status: 'pending'
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this'
      });
    }

    const report = await Report.create({
      reporter: req.user.id,
      type,
      target,
      reason,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/reports/:id/resolve
// @desc    Resolve report (Moderator only)
// @access  Moderator
router.put('/:id/resolve', moderatorOnly, [
  param('id').trim().notEmpty().withMessage('Report ID required'),
  body('actionTaken')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Action taken cannot exceed 500 characters'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }
    next();
  }
], async (req, res, next) => {
  try {
    const { actionTaken } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Report is already resolved or dismissed'
      });
    }

    report.status = 'resolved';
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    report.actionTaken = actionTaken || '';

    await report.save();

    res.json({
      success: true,
      message: 'Report resolved',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/reports/:id/dismiss
// @desc    Dismiss report (Moderator only)
// @access  Moderator
router.put('/:id/dismiss', moderatorOnly, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Report is already resolved or dismissed'
      });
    }

    report.status = 'dismissed';
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();

    await report.save();

    res.json({
      success: true,
      message: 'Report dismissed',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
