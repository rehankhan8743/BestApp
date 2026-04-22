const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: String
  }
}, {
  timestamps: true
});

downloadSchema.index({ thread: 1 });
downloadSchema.index({ user: 1 });

module.exports = mongoose.model('Download', downloadSchema);
