const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, moderatorOnly } = require('../middleware/auth');
const { createThreadValidator } = require('../middleware/validator');
const { generateSlug, generateUniqueSlug, sanitizeContent } = require('../utils/helpers.js');

// @route   GET /api/threads
// @desc    Get all threads (with filters)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-lastReplyAt';
    const category = req.query.category;
    const type = req.query.type;
    const search = req.query.search;

    const query = { isDeleted: false };
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$text = { $search: search };
    }

    const threads = await Thread.paginate(query, {
      page,
      limit,
      sort,
      populate: [
        { path: 'author', select: 'username avatar reputation' },
        { path: 'category', select: 'name slug color' },
        { path: 'lastReplyBy', select: 'username' }
      ]
    });

    res.json({
      success: true,
      data: threads.docs,
      pagination: {
        total: threads.totalDocs,
        page: threads.page,
        pages: threads.totalPages,
        limit: threads.limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/threads/trending
// @desc    Get trending threads
// @access  Public
router.get('/trending', async (req, res, next) => {
  try {
    const threads = await Thread.find({ isDeleted: false })
      .sort('-views -repliesCount')
      .limit(10)
      .populate('author', 'username avatar')
      .populate('category', 'name slug color');

    res.json({ success: true, data: threads });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/threads/latest
// @desc    Get latest threads
// @access  Public
router.get('/latest', async (req, res, next) => {
  try {
    const threads = await Thread.find({ isDeleted: false })
      .sort('-createdAt')
      .limit(10)
      .populate('author', 'username avatar')
      .populate('category', 'name slug color');

    res.json({ success: true, data: threads });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/threads/:slug
// @desc    Get single thread with posts
// @access  Public
router.get('/:slug', async (req, res, next) => {
  try {
    const thread = await Thread.findOne({ slug: req.params.slug, isDeleted: false })
      .populate('author', 'username avatar reputation bio joinedAt')
      .populate('category', 'name slug')
      .populate('lastReplyBy', 'username');

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    thread.views += 1;
    await thread.save();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.paginate(
      { thread: thread._id, isDeleted: false },
      {
        page,
        limit,
        sort: 'createdAt',
        populate: { path: 'author', select: 'username avatar reputation role joinedAt' }
      }
    );

    res.json({
      success: true,
      data: {
        thread,
        posts: posts.docs,
        pagination: {
          total: posts.totalDocs,
          page: posts.page,
          pages: posts.totalPages,
          limit: posts.limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/threads
// @desc    Create new thread
// @access  Private
router.post('/', protect, createThreadValidator, async (req, res, next) => {
  try {
    const { title, content, category, type, tags, releaseInfo } = req.body;

    const cat = await Category.findById(category);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const baseSlug = generateSlug(title);
    const slug = await generateUniqueSlug(baseSlug, Thread);

    const thread = await Thread.create({
      title,
      slug,
      content: sanitizeContent(content),
      author: req.user._id,
      category: category,
      type: type || 'discussion',
      tags: tags || [],
      releaseInfo: releaseInfo || undefined
    });

    await Post.create({
      thread: thread._id,
      author: req.user._id,
      content: sanitizeContent(content)
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { threadsCount: 1, reputation: 2 }
    });

    await Category.findByIdAndUpdate(category, {
      $inc: { threadsCount: 1, postsCount: 1 },
      lastThread: thread._id,
      lastPostAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Thread created successfully',
      data: thread
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/threads/:id
// @desc    Update thread
// @access  Private (Author/Admin/Mod)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (thread.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, content, tags, releaseInfo } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = sanitizeContent(content);
    if (tags) updateData.tags = tags;
    if (releaseInfo) updateData.releaseInfo = releaseInfo;

    const updated = await Thread.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    });

    res.json({ success: true, message: 'Thread updated', data: updated });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/threads/:id
// @desc    Delete thread (soft delete)
// @access  Private (Author/Admin/Mod)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (thread.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Thread.findByIdAndUpdate(req.params.id, { isDeleted: true });
    await Post.updateMany({ thread: req.params.id }, { isDeleted: true });

    res.json({ success: true, message: 'Thread deleted' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/threads/:id/like
// @desc    Like/unlike thread
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const likeIndex = thread.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex > -1) {
      thread.likes.splice(likeIndex, 1);
    } else {
      thread.likes.push({ user: req.user._id });

      if (thread.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: thread.author,
          sender: req.user._id,
          type: 'like',
          title: 'New Like',
          message: `${req.user.username} liked your thread "${thread.title}"`,
          link: { thread: thread._id, url: `/threads/${thread.slug}` }
        });
      }
    }

    await thread.save();
    res.json({ success: true, data: { likes: thread.likes.length } });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/threads/:id/pin
// @desc    Pin/unpin thread
// @access  Moderator only
router.post('/:id/pin', protect, moderatorOnly, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    thread.isPinned = !thread.isPinned;
    await thread.save();

    res.json({
      success: true,
      message: thread.isPinned ? 'Thread pinned' : 'Thread unpinned',
      data: { isPinned: thread.isPinned }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/threads/:id/lock
// @desc    Lock/unlock thread
// @access  Moderator only
router.post('/:id/lock', protect, moderatorOnly, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    thread.isLocked = !thread.isLocked;
    await thread.save();

    res.json({
      success: true,
      message: thread.isLocked ? 'Thread locked' : 'Thread unlocked',
      data: { isLocked: thread.isLocked }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
