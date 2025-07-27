const mongoose = require('mongoose');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const User = require('./models/User');

// MongoDB connection
const MONGO_URI = 'mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const generateRoomId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `room_${sortedIds[0]}_${sortedIds[1]}`;
};

const createTestChats = async () => {
  try {
    console.log('Creating test chats...');

    // Get existing users
    const users = await User.find({});
    const admins = users.filter(user => user.role === 'admin');
    const regularUsers = users.filter(user => user.role === 'user');

    if (admins.length === 0 || regularUsers.length === 0) {
      console.log('Need at least one admin and one user to create chats');
      return;
    }

    const admin = admins[0];
    const user = regularUsers[0];

    console.log(`Creating chat between Admin: ${admin.name} and User: ${user.name}`);

    // Create chat room
    const roomId = generateRoomId(admin._id, user._id);
    
    let chatRoom = await ChatRoom.findOne({ roomId });
    if (!chatRoom) {
      chatRoom = new ChatRoom({
        roomId,
        participants: [admin._id, user._id]
      });
      await chatRoom.save();
      console.log('Chat room created');
    }

    // Create sample messages
    const sampleMessages = [
      {
        senderId: user._id,
        receiverId: admin._id,
        message: "Hi! I need help with my account.",
        messageType: 'text'
      },
      {
        senderId: admin._id,
        receiverId: user._id,
        message: "Hello! I'm here to help. What's the issue?",
        messageType: 'text'
      },
      {
        senderId: user._id,
        receiverId: admin._id,
        message: "I can't access the CRM features. It says I don't have permission.",
        messageType: 'text'
      },
      {
        senderId: admin._id,
        receiverId: user._id,
        message: "Let me check your permissions. Can you tell me what specific feature you're trying to access?",
        messageType: 'text'
      },
      {
        senderId: user._id,
        receiverId: admin._id,
        message: "I'm trying to view the customer data section.",
        messageType: 'text'
      },
      {
        senderId: admin._id,
        receiverId: user._id,
        message: "I see the issue. Your account needs to be upgraded to access that feature. I'll upgrade it for you now.",
        messageType: 'text'
      },
      {
        senderId: user._id,
        receiverId: admin._id,
        message: "Thank you so much! That would be great.",
        messageType: 'text'
      },
      {
        senderId: admin._id,
        receiverId: user._id,
        message: "You're welcome! I've upgraded your account. You should now be able to access all CRM features. Let me know if you need anything else!",
        messageType: 'text'
      }
    ];

    // Add timestamps to messages (spread them out over the last few hours)
    const now = new Date();
    const messagesWithTimestamps = sampleMessages.map((msg, index) => ({
      ...msg,
      chatRoomId: roomId,
      createdAt: new Date(now.getTime() - (sampleMessages.length - index - 1) * 15 * 60 * 1000), // 15 minutes apart
      updatedAt: new Date(now.getTime() - (sampleMessages.length - index - 1) * 15 * 60 * 1000)
    }));

    // Save messages
    for (const messageData of messagesWithTimestamps) {
      const message = new Message(messageData);
      await message.save();
    }

    // Update chat room with last message
    const lastMessage = messagesWithTimestamps[messagesWithTimestamps.length - 1];
    chatRoom.lastMessage = lastMessage.message;
    chatRoom.lastMessageTime = lastMessage.createdAt;
    chatRoom.lastMessageSender = lastMessage.senderId;
    // Initialize unreadCount as object if not exists
    if (!chatRoom.unreadCount) {
      chatRoom.unreadCount = {};
    }
    await chatRoom.save();

    console.log(`Created ${messagesWithTimestamps.length} test messages`);
    console.log('Test chats created successfully!');

    // Create another conversation if there are more users
    if (admins.length > 1 && regularUsers.length > 1) {
      const admin2 = admins[1];
      const user2 = regularUsers[1];

      console.log(`Creating second chat between Admin: ${admin2.name} and User: ${user2.name}`);

      const roomId2 = generateRoomId(admin2._id, user2._id);
      
      let chatRoom2 = await ChatRoom.findOne({ roomId: roomId2 });
      if (!chatRoom2) {
        chatRoom2 = new ChatRoom({
          roomId: roomId2,
          participants: [admin2._id, user2._id]
        });
        await chatRoom2.save();
      }

      const sampleMessages2 = [
        {
          senderId: user2._id,
          receiverId: admin2._id,
          message: "Good morning! I have a question about the billing.",
          messageType: 'text'
        },
        {
          senderId: admin2._id,
          receiverId: user2._id,
          message: "Good morning! Sure, what's your question?",
          messageType: 'text'
        },
        {
          senderId: user2._id,
          receiverId: admin2._id,
          message: "I noticed an extra charge on my last invoice. Can you help me understand what it's for?",
          messageType: 'text'
        }
      ];

      const messagesWithTimestamps2 = sampleMessages2.map((msg, index) => ({
        ...msg,
        chatRoomId: roomId2,
        createdAt: new Date(now.getTime() - (sampleMessages2.length - index - 1) * 10 * 60 * 1000), // 10 minutes apart
        updatedAt: new Date(now.getTime() - (sampleMessages2.length - index - 1) * 10 * 60 * 1000)
      }));

      for (const messageData of messagesWithTimestamps2) {
        const message = new Message(messageData);
        await message.save();
      }

      const lastMessage2 = messagesWithTimestamps2[messagesWithTimestamps2.length - 1];
      chatRoom2.lastMessage = lastMessage2.message;
      chatRoom2.lastMessageTime = lastMessage2.createdAt;
      chatRoom2.lastMessageSender = lastMessage2.senderId;
      // Initialize unreadCount as object if not exists
      if (!chatRoom2.unreadCount) {
        chatRoom2.unreadCount = {};
      }
      await chatRoom2.save();

      console.log(`Created ${messagesWithTimestamps2.length} additional test messages`);
    }

  } catch (error) {
    console.error('Error creating test chats:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestChats();