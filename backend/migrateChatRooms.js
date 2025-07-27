const mongoose = require('mongoose');
const ChatRoom = require('./models/ChatRoom');

// MongoDB connection
const MONGO_URI = 'mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const migrateChatRooms = async () => {
  try {
    console.log('Migrating chat rooms...');

    // Find all chat rooms
    const chatRooms = await ChatRoom.find({});
    
    for (const chatRoom of chatRooms) {
      // If unreadCount is a Map or undefined, convert it to object
      if (!chatRoom.unreadCount || typeof chatRoom.unreadCount !== 'object' || chatRoom.unreadCount instanceof Map) {
        chatRoom.unreadCount = {};
        await chatRoom.save();
        console.log(`Migrated chat room: ${chatRoom.roomId}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
  }
};

migrateChatRooms(); 