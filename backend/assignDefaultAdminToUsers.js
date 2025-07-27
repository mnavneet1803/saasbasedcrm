const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const assignDefaultAdmin = async () => {
  try {
    const defaultAdmin = await User.findOne({ role: 'admin', status: 'active' });
    if (!defaultAdmin) {
      console.log('No active admin found.');
      return;
    }
    const users = await User.find({ role: 'user', $or: [{ createdBy: { $exists: false } }, { createdBy: null }] });
    if (users.length === 0) {
      console.log('All users already have an assigned admin.');
      return;
    }
    for (const user of users) {
      user.createdBy = defaultAdmin._id;
      await user.save();
      console.log(`Assigned admin ${defaultAdmin.email} to user ${user.email}`);
    }
    console.log('Assignment complete.');
  } catch (err) {
    console.error('Error assigning default admin:', err);
  } finally {
    mongoose.connection.close();
  }
};

assignDefaultAdmin(); 