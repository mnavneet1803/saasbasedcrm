const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const subscribedAdmin = require('../middleware/subscribedAdmin');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

// Helper function to generate room ID
const generateRoomId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `room_${sortedIds[0]}_${sortedIds[1]}`;
};

// Helper function to get or create chat room
const getOrCreateChatRoom = async (userId1, userId2) => {
  const roomId = generateRoomId(userId1, userId2);
  
  let chatRoom = await ChatRoom.findOne({ roomId });
  
  if (!chatRoom) {
    chatRoom = new ChatRoom({
      roomId,
      participants: [userId1, userId2]
    });
    await chatRoom.save();
  }
  
  return chatRoom;
};

// Get chat conversations for current user
router.get('/conversations', auth, (req, res, next) => {
  if (req.user.role === 'admin') return subscribedAdmin(req, res, next);
  next();
}, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let conversations = [];
    
    if (userRole === 'admin') {
      // Admin can see conversations with their users
      const users = await User.find({ createdBy: userId });
      const userIds = users.map(user => user._id);
      
      // Get all chat rooms where admin is a participant
      const allAdminRooms = await ChatRoom.find({
        participants: userId
      }).populate('participants', 'name email role')
        .populate('lastMessageSender', 'name')
        .sort({ lastMessageTime: -1 });
      
      // Convert userIds to strings for comparison
      const userIdStrings = userIds.map(id => id.toString());
      conversations = allAdminRooms.filter(room => {
        // Get all participants except the admin
        const otherParticipants = room.participants.filter(p => p._id.toString() !== userId.toString());
        // Check if any other participant is in the admin's user list
        return otherParticipants.some(p => userIdStrings.includes(p._id.toString()));
      });
        
    } else if (userRole === 'user') {
      // User can see conversation with their admin
      const user = await User.findById(userId);
      if (user && user.createdBy) {
        conversations = await ChatRoom.find({
          participants: { $all: [userId, user.createdBy] }
        }).populate('participants', 'name email role')
          .populate('lastMessageSender', 'name')
          .sort({ lastMessageTime: -1 });
      }
    } else if (userRole === 'superadmin') {
      // SuperAdmin can see all conversations
      conversations = await ChatRoom.find({})
        .populate('participants', 'name email role')
        .populate('lastMessageSender', 'name')
        .sort({ lastMessageTime: -1 });
    }
    
    // Ensure unreadCount is initialized for all conversations
    conversations = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.unreadCount || {}
    }));
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific conversation
router.get('/messages/:otherUserId', auth, (req, res, next) => {
  if (req.user.role === 'admin') return subscribedAdmin(req, res, next);
  next();
}, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;
    const { page = 1, limit = 50 } = req.query;
    
    // Validate access
    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);
    
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check access permissions
    if (req.user.role === 'admin') {
      // Admin can only chat with their users
      const isOwnUser = await User.findOne({ _id: otherUserId, createdBy: userId });
      if (!isOwnUser) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'user') {
      // User can only chat with their admin
      if (otherUserId !== user.createdBy?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // SuperAdmin can access any conversation
    
    const roomId = generateRoomId(userId, otherUserId);
    
    const messages = await Message.find({ chatRoomId: roomId })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Mark messages as seen
    await Message.updateMany(
      { 
        chatRoomId: roomId, 
        receiverId: userId, 
        seen: false 
      },
      { seen: true }
    );
    
    res.json({
      messages: messages.reverse(),
      currentPage: page,
      totalPages: Math.ceil(await Message.countDocuments({ chatRoomId: roomId }) / limit)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific room (SuperAdmin only)
router.get('/messages/room/:roomId', auth, role(['superadmin']), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ chatRoomId: roomId })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      messages: messages.reverse(),
      currentPage: page,
      totalPages: Math.ceil(await Message.countDocuments({ chatRoomId: roomId }) / limit)
    });
  } catch (error) {
    console.error('Error fetching messages for room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/send', auth, (req, res, next) => {
  if (req.user.role === 'admin') return subscribedAdmin(req, res, next);
  next();
}, async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text' } = req.body;
    const senderId = req.user.id;
    
    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver ID and message are required' });
    }
    
    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Check access permissions
    if (req.user.role === 'admin') {
      // Admin can only send to their users
      const isOwnUser = await User.findOne({ _id: receiverId, createdBy: senderId });
      if (!isOwnUser) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'user') {
      // User can only send to their admin
      const sender = await User.findById(senderId);
      if (receiverId !== sender.createdBy?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // SuperAdmin can send to anyone
    
    const roomId = generateRoomId(senderId, receiverId);
    
    // Get or create chat room
    const chatRoom = await getOrCreateChatRoom(senderId, receiverId);
    
    // Create message
    const newMessage = new Message({
      chatRoomId: roomId,
      senderId,
      receiverId,
      message,
      messageType
    });
    
    await newMessage.save();
    
    // Update chat room
    chatRoom.lastMessage = message;
    chatRoom.lastMessageTime = new Date();
    chatRoom.lastMessageSender = senderId;
    
    // Update unread count for receiver
    const currentUnread = chatRoom.unreadCount[receiverId] || 0;
    chatRoom.unreadCount[receiverId] = currentUnread + 1;
    
    await chatRoom.save();
    
    // Populate sender info for response
    await newMessage.populate('senderId', 'name email role');
    await newMessage.populate('receiverId', 'name email role');
    
    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as seen
router.put('/mark-seen/:otherUserId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;
    const roomId = generateRoomId(userId, otherUserId);
    
    await Message.updateMany(
      { 
        chatRoomId: roomId, 
        receiverId: userId, 
        seen: false 
      },
      { seen: true }
    );
    
    // Reset unread count
    const chatRoom = await ChatRoom.findOne({ roomId });
    if (chatRoom) {
      chatRoom.unreadCount[userId] = 0;
      await chatRoom.save();
    }
    
    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      seen: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search messages (SuperAdmin only)
router.get('/search', auth, role(['superadmin']), async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const messages = await Message.find({
      message: { $regex: query, $options: 'i' }
    })
    .populate('senderId', 'name email role')
    .populate('receiverId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    res.json({
      messages,
      currentPage: page,
      totalPages: Math.ceil(await Message.countDocuments({ message: { $regex: query, $options: 'i' } }) / limit)
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 