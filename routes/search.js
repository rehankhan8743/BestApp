const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const User = require('../models/User');
const { searchValidator } = require('../middleware/validator');

// @route   GET /api/search
// @desc    Search threads, posts, and users
// @access  Public
router.get('/', searchValidator, async (req, res, next) => {
  try {
    const { q, type, category, sort, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    let results = {};

    // Search threads
    if (!type || type === 'threads') {
      const threadQuery = {
        isDeleted: false,
        $text: { $search: q }
      };
      if (category) threadQuery.category = category;

      const threads = await Thread.find(threadQuery)
        .sort(sort === 'relevance' ? { score: { $meta: 'textScore' } } : '-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username avatar')
        .populate('category', 'name slug color');

      const threadCount = await Thread.countDocuments(threadQuery);
      results.threads = { data: threads, total: threadCount };
    }

    // Search posts
    if (!type || type === 'posts') {
      const posts = await Post.find({
        isDeleted: false,
        $text: { $search: q }
      })
        .sort(sort === 'relevance' ? { score: { $meta: 'textScore' } } : '-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username avatar')
        .populate('thread', 'title slug');

      const postCount = await Post.countDocuments({
        isDeleted: false,
        $text: { $search: q }
      });
      results.posts = { data: posts, total: postCount };
    }

    // Search users
    if (!type || type === 'users') {
      const users = await User.find({
        isBanned: false,
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ]
      })
        .select('-password -email')
        .skip(skip)
        .limit(parseInt(limit));

      const userCount = await User.countDocuments({
        isBanned: false,
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ]
      });
      results.users = { data: users, total: userCount };
    }

    res.json({
      success: true,
      query: q,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const threads = await Thread.find({
      isDeleted: false,
      title: { $regex: q, $options: 'i' }
    })
      .limit(5)
      .select('title slug');

    const users = await User.find({
      isBanned: false,
      username: { $regex: q, $options: 'i' }
    })
      .limit(5)
      .select('username avatar');

    res.json({
      success: true,
      data: { threads, users }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
