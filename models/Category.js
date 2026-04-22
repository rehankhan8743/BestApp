const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  threadsCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  lastThread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread'
  },
  lastPostAt: {
    type: Date
  },
  permissions: {
    canRead: { type: [String], default: ['user', 'moderator', 'admin'] },
    canPost: { type: [String], default: ['user', 'moderator', 'admin'] }
  }
}, {
  timestamps: true
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

categorySchema.index({ parent: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);
