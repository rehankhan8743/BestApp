const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Thread = require('../models/Thread');
const User = require('../models/User');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const { protect, moderatorOnly } = require('../middleware/auth');
const { createPostValidator } = require('../middleware/validator');
const { sanitizeContent } = require('../utils/helpers');

// @route   POST /api/posts
// @desc    Create new post/reply
// @access  Private
router.post('/', protect, createPostValidator, async (req, res, next) => {
  try {
    const { content, thread, parentPost } = req.body;

    const threadDoc = await Thread.findById(thread);
    if (!threadDoc) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (threadDoc.isLocked) {
      return res.status(403).json({ success: false, message: 'Thread is locked' });
    }

    const post = await Post.create({
      thread,
      author: req.user._id,
      content: sanitizeContent(content),
      parentPost: parentPost || null
    });

    threadDoc.repliesCount += 1;
    threadDoc.lastReply = post._id;
    threadDoc.lastReplyAt = new Date();
    threadDoc.lastReplyBy = req.user._id;
    await threadDoc.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postsCount: 1, reputation: 1 }
    });

    await Category.findByIdAndUpdate(threadDoc.category, {
      $inc: { postsCount: 1 },
      lastPostAt: new Date()
    });

    if (threadDoc.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: threadDoc.author,
        sender: req.user._id,
        type: 'thread_reply',
        title: 'New Reply',
        message: `${req.user.username} replied to your thread "${threadDoc.title}"`,
        link: {
          thread: threadDoc._id,
          post: post._id,
          url: `/threads/${threadDoc.slug}?page=last#post-${post._id}`
        }
      });
    }

    if (parentPost) {
      const parent = await Post.findById(parentPost);
      if (parent && parent.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parent.author,
          sender: req.user._id,
          type: 'reply',
          title: 'New Reply',
          message: `${req.user.username} replied to your post`,
          link: {
            thread: threadDoc._id,
            post: post._id,
            url: `/threads/${threadDoc.slug}?page=last#post-${post._id}`
          }
        });
      }
    }

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar reputation role joinedAt');

    res.status(201).json({
      success: true,
      message: 'Post created',
      data: populatedPost
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (Author/Admin/Mod)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content, editReason } = req.body;
    post.content = sanitizeContent(content);
    post.isEdited = true;
    post.editedAt = new Date();
    if (editReason) post.editReason = editReason;
    await post.save();

    res.json({ success: true, message: 'Post updated', data: post });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post (soft delete)
// @access  Private (Author/Admin/Mod)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Post.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deleteReason: req.body.reason || 'Deleted by user'
    });

    await Thread.findByIdAndUpdate(post.thread, { $inc: { repliesCount: -1 } });

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike post
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push({ user: req.user._id });

      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          title: 'New Like',
          message: `${req.user.username} liked your post`,
          link: { post: post._id }
        });
      }
    }

    await post.save();
    res.json({ success: true, data: { likes: post.likes.length } });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/posts/:id/thanks
// @desc    Give thanks to post
// @access  Private
router.post('/:id/thanks', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const thanksIndex = post.thanks.findIndex(
      t => t.user.toString() === req.user._id.toString()
    );

    if (thanksIndex > -1) {
      post.thanks.splice(thanksIndex, 1);
      await User.findByIdAndUpdate(post.author, { $inc: { thanksReceived: -1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { thanksGiven: -1 } });
    } else {
      post.thanks.push({ user: req.user._id });
      await User.findByIdAndUpdate(post.author, { $inc: { thanksReceived: 1, reputation: 1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { thanksGiven: 1 } });

      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'thanks',
        title: 'New Thanks',
        message: `${req.user.username} thanked you for your post`,
        link: { post: post._id }
      });
    }

    await post.save();
    res.json({ success: true, data: { thanks: post.thanks.length } });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/posts/:id/report
// @desc    Report post
// @access  Private
router.post('/:id/report', protect, async (req, res, next) => {
  try {
    const { reason, description } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.reports.push({
      reporter: req.user._id,
      reason,
      description
    });

    await post.save();
    res.json({ success: true, message: 'Post reported' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
