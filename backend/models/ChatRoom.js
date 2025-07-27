const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unreadCount: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ lastMessageTime: -1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema); 