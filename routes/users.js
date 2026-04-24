const express = require('express');
const User = require('../models/User.js');
const Thread = require('../models/Thread.js');
const Post = require('../models/Post.js');
const Reputation = require('../models/Reputation.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// Get user dashboard stats
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user with populated stats
    const user = await User.findById(userId);

    // Count threads and posts in period
    const threadsThisPeriod = await Thread.countDocuments({
      author: userId,
      createdAt: { $gte: startDate }
    });

    const postsThisPeriod = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: startDate }
    });

    // Get total views for user's threads
    const threads = await Thread.find({ author: userId });
    const totalViews = threads.reduce((sum, t) => sum + (t.views || 0), 0);

    // Get views in period
    const threadsInPeriod = await Thread.find({
      author: userId,
      createdAt: { $gte: startDate }
    });
    const viewsThisPeriod = threadsInPeriod.reduce((sum, t) => sum + (t.views || 0), 0);

    // Count likes on user's posts
    const userPosts = await Post.find({ author: userId });
    const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

    const postsInPeriod = await Post.find({
      author: userId,
      createdAt: { $gte: startDate }
    });
    const likesThisPeriod = postsInPeriod.reduce((sum, p) => sum + (p.likes || 0), 0);

    // Get followers count
    const followersCount = user.followers?.length || 0;

    // Get bookmarks count
    const bookmarksCount = user.bookmarks?.length || 0;

    // Get best answers count
    const bestAnswers = await Post.countDocuments({
      author: userId,
      isBestAnswer: true
    });

    res.json({
      success: true,
      data: {
        totalThreads: await Thread.countDocuments({ author: userId }),
        totalPosts: await Post.countDocuments({ author: userId }),
        totalViews,
        totalLikes,
        followersCount,
        bookmarksCount,
        bestAnswers,
        threadsThisPeriod,
        postsThisPeriod,
        viewsThisPeriod,
        likesThisPeriod
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// Get user's recent threads
router.get('/dashboard/threads', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const threads = await Thread.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .populate('author', 'username avatar');

    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threads'
    });
  }
});

// Get user's recent posts
router.get('/dashboard/posts', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('thread', 'title slug')
      .populate('author', 'username avatar');

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
});

// Get user's followers
router.get('/dashboard/followers', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const user = await User.findById(req.user._id)
      .populate({
        path: 'followers',
        options: { sort: { createdAt: -1 }, limit: parseInt(limit) },
        select: 'username avatar'
      });

    res.json({
      success: true,
      data: user.followers || []
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers'
    });
  }
});

// Get user's activity timeline
router.get('/dashboard/activity', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = [];

    // Get threads created
    const threads = await Thread.find({
      author: req.user._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).limit(20);

    threads.forEach(thread => {
      activities.push({
        type: 'thread_created',
        description: `Created thread: ${thread.title}`,
        createdAt: thread.createdAt,
        thread
      });
    });

    // Get posts created
    const posts = await Post.find({
      author: req.user._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).limit(20);

    posts.forEach(post => {
      activities.push({
        type: 'post_created',
        description: `Posted in: ${post.thread?.title || 'thread'}`,
        createdAt: post.createdAt,
        thread: post.thread
      });
    });

    // Sort by date and return
    activities.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: activities.slice(0, 30)
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity'
    });
  }
});

// Get user's reputation history
router.get('/:username/reputation', protect, async (req, res) => {
  try {
    const { username } = req.params;
    const { period = 'all' } = req.query;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let dateFilter = {};
    if (period !== 'all') {
      const startDate = new Date();
      if (period === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: startDate } };
    }

    const reputationHistory = await Reputation.find({
      user: user._id,
      ...dateFilter
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('from', 'username avatar')
      .populate('thread', 'title slug');

    // Calculate stats
    const stats = await Reputation.aggregate([
      { $match: { user: user._id, ...dateFilter } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    const statsObj = {};
    stats.forEach(s => {
      statsObj[s._id] = { count: s.count, points: s.totalPoints };
    });

    res.json({
      success: true,
      data: {
        history: reputationHistory,
        stats: {
          upvotesReceived: statsObj['upvote_received']?.count || 0,
          downvotesReceived: statsObj['downvote_received']?.count || 0,
          bestAnswers: statsObj['best_answer']?.count || 0,
          totalLikes: (statsObj['thread_liked']?.count || 0) + (statsObj['post_liked']?.count || 0)
        }
      }
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reputation history'
    });
  }
});

// Update user settings
router.put('/settings', protect, async (req, res) => {
  try {
    const { notifications, privacy, appearance } = req.body;
    const updateData = {};

    if (notifications) {
      updateData.notifications = notifications;
    }
    if (privacy) {
      updateData.privacy = privacy;
    }
    if (appearance) {
      updateData.appearance = appearance;
    }

    await User.findByIdAndUpdate(req.user._id, updateData);

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Delete account
router.put('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Soft delete - mark user as deleted
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      username: `deleted_${userId}`,
      email: `deleted_${userId}@deleted.com`
    });

    // TODO: Optionally anonymize or delete user's posts/threads

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

module.exports = router;
