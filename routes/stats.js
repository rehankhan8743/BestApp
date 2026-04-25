const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Thread = require('../models/Thread.js');
const Post = require('../models/Post.js');

// @route   GET /api/stats
// @desc    Get public statistics (Anyone)
// @access  Public
router.get('/', async (req, res, next) => {
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

module.exports = router;
