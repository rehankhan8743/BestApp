const mongoose = require('mongoose');

const privateMessageSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    attachments: [{
      filename: String,
      url: String
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

privateMessageSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model('PrivateMessage', privateMessageSchema);
