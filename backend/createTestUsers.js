const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection
mongoose.connect('mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestUsers = async () => {
  try {
    // First, find the test admin
    const testAdmin = await User.findOne({ email: 'testadmin@gmail.com' });
    
    if (!testAdmin) {
      console.log('Test admin not found. Please create test admin first.');
      return;
    }

    // Sample users to create
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91-9876543210',
        password: 'password123',
        role: 'user',
        createdBy: testAdmin._id,
        status: 'active'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+91-9876543211',
        password: 'password123',
        role: 'user',
        createdBy: testAdmin._id,
        status: 'active'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '+91-9876543212',
        password: 'password123',
        role: 'user',
        createdBy: testAdmin._id,
        status: 'blocked'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        phone: '+91-9876543213',
        password: 'password123',
        role: 'user',
        createdBy: testAdmin._id,
        status: 'active'
      }
    ];

    // Check if users already exist
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`Created user: ${userData.name} (${userData.email})`);
    }

    console.log('Test users created successfully!');
    
    // Display all users created by test admin
    const adminUsers = await User.find({ 
      createdBy: testAdmin._id,
      role: 'user'
    }).select('-password');
    
    console.log('\nUsers created by test admin:');
    adminUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Status: ${user.status}`);
    });

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUsers(); 