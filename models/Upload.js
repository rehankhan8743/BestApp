const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'failed'],
    default: 'active'
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

// Index for faster queries
uploadSchema.index({ user: 1, createdAt: -1 });
uploadSchema.index({ user: 1, mimeType: 1 });

const Upload = mongoose.model('Upload', uploadSchema);

module.exports = Upload;
