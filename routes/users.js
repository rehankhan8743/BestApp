const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (with pagination)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-reputation';
    const search = req.query.search || '';

    const query = { isBanned: false };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page,
      limit,
      sort,
      select: '-password -email'
    };

    const users = await User.paginate(query, options);

    res.json({
      success: true,
      data: users.docs,
      pagination: {
        total: users.totalDocs,
        page: users.page,
        pages: users.totalPages,
        limit: users.limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:username
// @desc    Get user profile
// @access  Public
router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const recentThreads = await Thread.find({ author: user._id, isDeleted: false })
      .sort('-createdAt')
      .limit(5)
      .select('title slug createdAt views repliesCount');

    const recentPosts = await Post.find({ author: user._id, isDeleted: false })
      .sort('-createdAt')
      .limit(5)
      .populate('thread', 'title slug')
      .select('content createdAt thread');

    res.json({
      success: true,
      data: {
        user,
        recentThreads,
        recentPosts
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:username/threads
// @desc    Get user's threads
// @access  Public
router.get('/:username/threads', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const threads = await Thread.paginate(
      { author: user._id, isDeleted: false },
      { page, limit, sort: '-createdAt', populate: 'category' }
    );

    res.json({
      success: true,
      data: threads.docs,
      pagination: {
        total: threads.totalDocs,
        page: threads.page,
        pages: threads.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/:id/ban
// @desc    Ban user
// @access  Admin/Moderator
router.post('/:id/ban', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, banReason: reason },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User banned', data: user });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/:id/unban
// @desc    Unban user
// @access  Admin/Moderator
router.post('/:id/unban', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: null },
      { new: true }
    );

    res.json({ success: true, message: 'User unbanned', data: user });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id/role
// @desc    Change user role
// @access  Admin only
router.put('/:id/role', protect, adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    res.json({ success: true, message: 'Role updated', data: user });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';

    const users = await User.find({
      isBanned: false,
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    })
      .select('username avatar role threadsCount postsCount reputation')
      .limit(20);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { bio, location, website } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio, location, website },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/bookmarks
// @desc    Get user bookmarks
// @access  Private
router.get('/bookmarks', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        select: 'title slug content author category repliesCount views createdAt'
      });

    res.json({
      success: true,
      data: user.bookmarks || []
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
