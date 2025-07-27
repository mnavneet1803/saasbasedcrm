const mongoose = require('mongoose');
const ChatRoom = require('./models/ChatRoom');
const User = require('./models/User');

// MongoDB connection
const MONGO_URI = 'mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const testChatAPI = async () => {
  try {
    console.log('Testing Chat API...');

    // Get all users
    const users = await User.find({});
    console.log('Total users:', users.length);

    // Get all chat rooms
    const chatRooms = await ChatRoom.find({}).populate('participants', 'name email role');
    console.log('Total chat rooms:', chatRooms.length);

    // Check each chat room
    chatRooms.forEach((room, index) => {
      console.log(`\nChat Room ${index + 1}:`);
      console.log('Room ID:', room.roomId);
      console.log('Participants:', room.participants.map(p => `${p.name} (${p.role})`));
      console.log('Last Message:', room.lastMessage);
      console.log('Unread Count:', room.unreadCount);
      console.log('Unread Count Type:', typeof room.unreadCount);
    });

    // Test admin conversations
    const admin = users.find(u => u.role === 'admin');
    if (admin) {
      console.log(`\nTesting conversations for admin: ${admin.name}`);
      
      const adminUsers = await User.find({ createdBy: admin._id });
      console.log('Admin users:', adminUsers.map(u => u.name));
      
      const adminRooms = await ChatRoom.find({
        participants: admin._id
      }).populate('participants', 'name email role');
      
      console.log('Admin rooms:', adminRooms.length);
      adminRooms.forEach(room => {
        console.log('Room participants:', room.participants.map(p => p.name));
      });
    }

  } catch (error) {
    console.error('Error testing chat API:', error);
  } finally {
    mongoose.connection.close();
  }
};

testChatAPI(); 