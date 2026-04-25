const express = require('express');
const router = express.Router();
const { protect, adminOnly, moderatorOnly } = require('../middleware/auth');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Category = require('../models/Category');

// Apply authentication to all routes
router.use(protect);

// ==================== STATS & DASHBOARD ====================

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics (Admin & Moderator)
// @access  Admin/Moderator
router.get('/stats', moderatorOnly, async (req, res, next) => {
  try {
    const [totalUsers, totalThreads, totalPosts, pendingReports] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'pending' })
    ]);

    // Get active users (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastActive: { $gte: oneDayAgo } });

    // Get today's posts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = await Post.countDocuments({ createdAt: { $gte: today } });

    // Get total views
    const threads = await Thread.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = threads[0]?.totalViews || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalThreads,
        totalPosts,
        pendingReports,
        activeUsers,
        todayPosts,
        totalViews
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/stats
// @desc    Get public statistics (Anyone)
// @access  Public
router.get('/public/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalThreads, totalPosts] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      Post.countDocuments()
    ]);

    // Get active users (last 15 minutes)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineUsers = await User.countDocuments({ lastActive: { $gte: fifteenMinAgo } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalThreads,
        totalPosts,
        onlineUsers
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/activity
// @desc    Get recent activity log (Admin & Moderator)
// @access  Admin/Moderator
router.get('/activity', moderatorOnly, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent actions from different models
    const [recentUsers, recentThreads, recentPosts, recentReports] = await Promise.all([
      User.find().select('username role createdAt').sort({ createdAt: -1 }).limit(limit),
      Thread.find().populate('author', 'username').select('title createdAt').sort({ createdAt: -1 }).limit(limit),
      Post.find().populate('author', 'username').select('content createdAt').sort({ createdAt: -1 }).limit(limit),
      Report.find().populate('reportedBy', 'username').select('type reason createdAt').sort({ createdAt: -1 }).limit(limit)
    ]);

    const activityLog = [
      ...recentUsers.map(u => ({ action: `New user registered: ${u.username}`, timestamp: u.createdAt, type: 'user' })),
      ...recentThreads.map(t => ({ action: `New thread: ${t.title} by ${t.author?.username}`, timestamp: t.createdAt, type: 'thread' })),
      ...recentPosts.map(p => ({ action: `New post by ${p.author?.username}`, timestamp: p.createdAt, type: 'post' })),
      ...recentReports.map(r => ({ action: `New ${r.type} report: ${r.reason}`, timestamp: r.createdAt, type: 'report' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.json({
      success: true,
      data: activityLog
    });
  } catch (error) {
    next(error);
  }
});

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get users (paginated) - Admin only
// @access  Admin
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

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

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user - Admin & Moderator
// @access  Admin/Moderator
router.put('/users/:id/ban', moderatorOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot ban admin user' });
    }

    user.isActive = false;
    user.isBanned = true;
    user.banReason = req.body.reason || 'Violated community guidelines';
    user.bannedAt = new Date();
    user.bannedBy = req.user._id;
    await user.save();

    res.json({
      success: true,
      message: 'User banned successfully',
      data: { _id: user._id, username: user.username, isActive: false, isBanned: true }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user - Admin & Moderator
// @access  Admin/Moderator
router.put('/users/:id/unban', moderatorOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = true;
    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    user.bannedBy = null;
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: { _id: user._id, username: user.username, isActive: true, isBanned: false }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user - Admin only
// @access  Admin
router.delete('/users/:id', adminOnly, async (req, res, next) => {
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

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role - Admin only
// @access  Admin
router.put('/users/:id/role', adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { _id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/users/bulk-ban
// @desc    Bulk ban users - Admin & Moderator
// @access  Admin/Moderator
router.post('/users/bulk-ban', moderatorOnly, async (req, res, next) => {
  try {
    const { userIds, reason } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, role: { $ne: 'admin' } },
      { 
        isActive: false, 
        isBanned: true, 
        banReason: reason || 'Violated community guidelines',
        bannedAt: new Date(),
        bannedBy: req.user._id
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users banned`,
      data: { modified: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/users/bulk-delete
// @desc    Bulk delete users - Admin only
// @access  Admin
router.post('/users/bulk-delete', adminOnly, async (req, res, next) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    const result = await User.deleteMany({ 
      _id: { $in: userIds }, 
      role: { $ne: 'admin' } 
    });

    res.json({
      success: true,
      message: `${result.deletedCount} users deleted`,
      data: { deleted: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== REPORT MANAGEMENT ====================

// @route   GET /api/admin/reports
// @desc    Get reports (paginated) - Admin & Moderator
// @access  Admin/Moderator
router.get('/reports', moderatorOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'pending';

    const reports = await Report.find({ status })
      .populate('reportedUser', 'username email role avatar')
      .populate('reportedBy', 'username avatar')
      .populate('resolvedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments({ status });

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

// @route   PUT /api/admin/reports/:id/resolve
// @desc    Resolve a report - Admin & Moderator
// @access  Admin/Moderator
router.put('/reports/:id/resolve', moderatorOnly, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'resolved';
    report.resolvedBy = req.user._id;
    report.resolution = req.body.resolution || 'Report addressed';
    report.resolvedAt = new Date();
    await report.save();

    res.json({
      success: true,
      message: 'Report resolved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/reports/:id/reject
// @desc    Reject a report - Admin & Moderator
// @access  Admin/Moderator
router.put('/reports/:id/reject', moderatorOnly, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'rejected';
    report.resolvedBy = req.user._id;
    report.resolution = req.body.resolution || 'Report rejected';
    report.resolvedAt = new Date();
    await report.save();

    res.json({
      success: true,
      message: 'Report rejected'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== THREAD MANAGEMENT ====================

// @route   GET /api/admin/threads
// @desc    Get all threads (paginated) - Admin & Moderator
// @access  Admin/Moderator
router.get('/threads', moderatorOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const threads = await Thread.find()
      .populate('author', 'username avatar role')
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Thread.countDocuments();

    res.json({
      success: true,
      data: threads,
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

// @route   PUT /api/admin/threads/:id/pin
// @desc    Pin/Unpin a thread - Admin & Moderator
// @access  Admin/Moderator
router.put('/threads/:id/pin', moderatorOnly, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    thread.pinned = !thread.pinned;
    await thread.save();

    res.json({
      success: true,
      message: thread.pinned ? 'Thread pinned' : 'Thread unpinned',
      data: { _id: thread._id, title: thread.title, pinned: thread.pinned }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/threads/:id/lock
// @desc    Lock/Unlock a thread - Admin & Moderator
// @access  Admin/Moderator
router.put('/threads/:id/lock', moderatorOnly, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    thread.locked = !thread.locked;
    await thread.save();

    res.json({
      success: true,
      message: thread.locked ? 'Thread locked' : 'Thread unlocked',
      data: { _id: thread._id, title: thread.title, locked: thread.locked }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/threads/:id
// @desc    Delete a thread - Admin & Moderator
// @access  Admin/Moderator
router.delete('/threads/:id', moderatorOnly, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    await thread.deleteOne();
    await Post.deleteMany({ thread: req.params.id });

    res.json({
      success: true,
      message: 'Thread and associated posts deleted'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== POST MANAGEMENT ====================

// @route   GET /api/admin/posts
// @desc    Get all posts (paginated) - Admin & Moderator
// @access  Admin/Moderator
router.get('/posts', moderatorOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username avatar role')
      .populate('thread', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      success: true,
      data: posts,
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

// @route   DELETE /api/admin/posts/:id
// @desc    Delete a post - Admin & Moderator
// @access  Admin/Moderator
router.delete('/posts/:id', moderatorOnly, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== CATEGORY MANAGEMENT ====================

// @route   GET /api/admin/categories
// @desc    Get all categories - Admin & Moderator
// @access  Admin/Moderator
router.get('/categories', moderatorOnly, async (req, res, next) => {
  try {
    const categories = await Category.find()
      .sort({ order: 1 })
      .populate('threadsCount', 'count');

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/categories
// @desc    Create a category - Admin only
// @access  Admin
router.post('/categories', adminOnly, async (req, res, next) => {
  try {
    const { name, description, color, icon, order } = req.body;

    const category = new Category({
      name,
      description,
      color,
      icon,
      order: order || 0
    });

    await category.save();

    res.json({
      success: true,
      message: 'Category created',
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update a category - Admin only
// @access  Admin
router.put('/categories/:id', adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, color, icon, order } = req.body;
    
    if (name) category.name = name;
    if (description) category.description = description;
    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (order !== undefined) category.order = order;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated',
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete a category - Admin only
// @access  Admin
router.delete('/categories/:id', adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SETTINGS & ANNOUNCEMENTS ====================

// @route   GET /api/admin/settings
// @desc    Get site settings - Admin only
// @access  Admin
router.get('/settings', adminOnly, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        siteName: 'BestApp Forum',
        siteDescription: 'Best community for apps, games, and more',
        maxFileSize: 100,
        avatarMaxSize: 5,
        screenshotMaxSize: 10,
        postsPerPage: 20,
        threadsPerPage: 20,
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: false,
        allowFileUploads: true,
        maxDailyPosts: 50,
        minReputationToPost: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/settings
// @desc    Update site settings - Admin only
// @access  Admin
router.put('/settings', adminOnly, async (req, res, next) => {
  try {
    const settings = req.body;
    
    res.json({
      success: true,
      message: 'Settings updated',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/announcements
// @desc    Get all announcements - Admin & Moderator
// @access  Admin/Moderator
router.get('/announcements', moderatorOnly, async (req, res, next) => {
  try {
    const announcements = await require('../models/Announcement').find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/announcements
// @desc    Create announcement - Admin only
// @access  Admin
router.post('/announcements', adminOnly, async (req, res, next) => {
  try {
    const Announcement = require('../models/Announcement');
    const { title, content, priority } = req.body;

    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'normal',
      author: req.user._id
    });

    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement created',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/announcements/:id
// @desc    Delete announcement - Admin only
// @access  Admin
router.delete('/announcements/:id', adminOnly, async (req, res, next) => {
  try {
    const Announcement = require('../models/Announcement');
    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
