const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// MongoDB connection
mongoose.connect('mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestAdmin = async () => {
  try {
    // Check if test admin already exists
    const existingAdmin = await User.findOne({ email: 'testadmin@gmail.com' });
    if (existingAdmin) {
      console.log('✅ Test admin already exists:', existingAdmin.email);
      return;
    }

    // Create test admin without subscription
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testAdmin = new User({
      name: 'Test Admin',
      email: 'testadmin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      // No plan assigned
    });

    await testAdmin.save();
    console.log('✅ Test admin created successfully!');
    console.log('📧 Email: testadmin@gmail.com');
    console.log('🔑 Password: password123');
    console.log('📋 Status: No subscription (will be redirected to plans)');
    
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestAdmin(); 