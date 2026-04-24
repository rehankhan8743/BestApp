const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const User = require('../models/User');

// All routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unread = req.query.unread === 'true';

    const query = { user: req.user._id };
    if (unread) query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedUser', 'username avatar');

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
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

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messages/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await Message.getConversations(req.user._id);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: conversationId },
        { sender: conversationId, recipient: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar role rank')
      .populate('recipient', 'username avatar');

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and content are required'
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim()
    });

    // Create notification for recipient
    await Notification.create({
      user: recipientId,
      type: 'message',
      message: `${req.user.username} sent you a message`,
      relatedUser: req.user._id
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/messages/conversation/:userId
// @desc    Delete conversation with a user
// @access  Private
router.delete('/conversation/:userId', async (req, res, next) => {
  try {
    await Message.deleteMany({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
