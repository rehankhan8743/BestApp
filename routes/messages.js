const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateMessage = [
  body('recipientUsername')
    .trim()
    .notEmpty().withMessage('Recipient username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 1, max: 10000 }).withMessage('Message must be 1-10000 characters'),
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

// @route   GET /api/messages
// @desc    Get user's conversations
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    let query = {
      participants: req.user.id,
      isDeleted: false
    };

    if (unreadOnly) {
      query['messages'] = {
        $elemMatch: {
          isRead: false,
          sender: { $ne: req.user.id }
        }
      };
    }

    const conversations = await PrivateMessage.find(query)
      .populate('participants', 'username avatar role reputation')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get last message and unread count for each conversation
    const formattedConversations = conversations.map(conv => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      const unreadCount = conv.messages.filter(
        msg => !msg.isRead && msg.sender.toString() !== req.user.id
      ).length;

      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user.id
      );

      return {
        _id: conv._id,
        subject: conv.subject,
        otherParticipant: otherParticipant ? {
          _id: otherParticipant._id,
          username: otherParticipant.username,
          avatar: otherParticipant.avatar,
          role: otherParticipant.role
        } : null,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null,
        unreadCount,
        updatedAt: conv.updatedAt
      };
    });

    const total = await PrivateMessage.countDocuments(query);

    res.json({
      success: true,
      data: formattedConversations,
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

// @route   GET /api/messages/:id
// @desc    Get single conversation
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const conversation = await PrivateMessage.findById(req.params.id)
      .populate('participants', 'username avatar role reputation')
      .populate('messages.sender', 'username avatar role reputation');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark messages as read
    conversation.messages.forEach(msg => {
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        msg.isRead = true;
        msg.readAt = new Date();
      }
    });

    await conversation.save();

    res.json({
      success: true,
      data: {
        _id: conversation._id,
        subject: conversation.subject,
        participants: conversation.participants.map(p => ({
          _id: p._id,
          username: p.username,
          avatar: p.avatar,
          role: p.role,
          reputation: p.reputation
        })),
        messages: conversation.messages.map(msg => ({
          _id: msg._id,
          sender: {
            _id: msg.sender._id,
            username: msg.sender.username,
            avatar: msg.sender.avatar,
            role: msg.sender.role
          },
          content: msg.content,
          isRead: msg.isRead,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
          attachments: msg.attachments
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages
// @desc    Start new conversation
// @access  Private
router.post('/', protect, validateMessage, async (req, res, next) => {
  try {
    const { recipientUsername, subject, content } = req.body;

    // Find recipient
    const recipient = await User.findOne({ username: recipientUsername }).select('_id');
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't message yourself
    if (recipient._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await PrivateMessage.findOne({
      participants: { $all: [req.user.id, recipient._id] },
      isDeleted: false
    });

    if (conversation) {
      // Add message to existing conversation
      conversation.messages.push({
        sender: req.user.id,
        content,
        isRead: false
      });
      conversation.subject = subject; // Update subject
      await conversation.save();

      return res.status(200).json({
        success: true,
        message: 'Message sent',
        data: { _id: conversation._id }
      });
    }

    // Create new conversation
    conversation = await PrivateMessage.create({
      participants: [req.user.id, recipient._id],
      subject,
      messages: [{
        sender: req.user.id,
        content,
        isRead: false
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { _id: conversation._id }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages/:id/reply
// @desc    Reply to conversation
// @access  Private
router.post('/:id/reply', protect, [
  param('id').trim().notEmpty().withMessage('Conversation ID required'),
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 10000 }).withMessage('Message cannot exceed 10000 characters'),
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
    const { content } = req.body;

    const conversation = await PrivateMessage.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    conversation.messages.push({
      sender: req.user.id,
      content,
      isRead: false
    });

    await conversation.save();

    res.json({
      success: true,
      message: 'Reply sent',
      data: { _id: conversation._id }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark conversation as read
// @access  Private
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const conversation = await PrivateMessage.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark all messages from other participants as read
    conversation.messages.forEach(msg => {
      if (!msg.isRead && msg.sender.toString() !== req.user.id) {
        msg.isRead = true;
        msg.readAt = new Date();
      }
    });

    await conversation.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete conversation
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const conversation = await PrivateMessage.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete - mark as deleted
    conversation.isDeleted = true;
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
