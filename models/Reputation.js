const mongoose = require('mongoose');

const reputationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'upvote_received',
      'downvote_received',
      'best_answer',
      'thread_liked',
      'post_liked',
      'daily_bonus'
    ],
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 0
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  description: String
}, {
  timestamps: true
});

// Indexes for faster queries
reputationSchema.index({ user: 1, createdAt: -1 });
reputationSchema.index({ user: 1, type: 1 });

const Reputation = mongoose.model('Reputation', reputationSchema);

module.exports = Reputation;
