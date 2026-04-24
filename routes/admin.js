const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const Report = require('../models/Report');

// Apply authentication and admin restriction to all routes
router.use(protect);
router.use(restrictTo('admin'));

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalThreads, totalPosts, pendingReports] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalThreads,
        totalPosts,
        pendingReports
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get users (paginated)
// @access  Admin
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
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

// @route   GET /api/admin/reports
// @desc    Get reports (paginated)
// @access  Admin
router.get('/reports', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .populate('reportedUser', 'username email role')
      .populate('reportedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments();

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

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Admin
router.put('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User banned successfully',
      data: { _id: user._id, username: user.username, isActive: false }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Admin
router.put('/users/:id/unban', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: { _id: user._id, username: user.username, isActive: true }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin user' });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/reports/:id/resolve
// @desc    Resolve a report
// @access  Admin
router.put('/reports/:id/resolve', async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'resolved';
    report.resolvedBy = req.user._id;
    await report.save();

    res.json({
      success: true,
      message: 'Report resolved successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
