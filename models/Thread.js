const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Thread title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  type: {
    type: String,
    enum: ['discussion', 'request', 'release', 'guide'],
    default: 'discussion'
  },
  releaseInfo: {
    appName: String,
    version: String,
    developer: String,
    fileSize: String,
    requirements: String,
    downloadLink: String,
    mirrorLinks: [String],
    screenshots: [String],
    changelog: String,
    virusTotalUrl: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isSolved: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  lastReplyAt: {
    type: Date,
    default: Date.now
  },
  lastReplyBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

threadSchema.index({ title: 'text', content: 'text', tags: 'text' });
threadSchema.index({ category: 1, isPinned: -1, lastReplyAt: -1 });
threadSchema.index({ author: 1 });
threadSchema.index({ slug: 1 });
threadSchema.index({ tags: 1 });
threadSchema.index({ type: 1 });
threadSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Thread', threadSchema);
