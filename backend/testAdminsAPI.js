const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
mongoose.connect('mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testAdminsAPI = async () => {
  try {
    console.log('Testing Admins API...');
    
    // Check if there are any admins in the database
    const admins = await User.find({ role: 'admin' }).populate('plan');
    console.log(`Found ${admins.length} admins in database:`);
    
    admins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email}) - Status: ${admin.status} - Plan: ${admin.plan?.name || 'No Plan'}`);
    });
    
    // Test the API endpoint
    const response = await fetch('http://localhost:5000/api/admins', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without authentication, but we can see if the route exists
      }
    });
    
    if (response.status === 401) {
      console.log('✅ API endpoint exists (401 Unauthorized - expected without auth)');
    } else {
      console.log(`❌ API endpoint issue: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

testAdminsAPI(); 