const mongoose = require('mongoose');
const Plan = require('./models/Plan');

// MongoDB connection
mongoose.connect('mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkAndCreatePlans = async () => {
  try {
    // Check existing plans
    const existingPlans = await Plan.find();
    console.log('📋 Existing plans:', existingPlans.length);
    
    if (existingPlans.length === 0) {
      console.log('🆕 No plans found. Creating test plans...');
      
      const testPlans = [
        {
          name: 'Basic Plan',
          price: 999,
          maxUsers: 10,
          features: ['User Management', 'Basic CRM', 'Email Support'],
          active: true
        },
        {
          name: 'Professional Plan',
          price: 1999,
          maxUsers: 50,
          features: ['User Management', 'Advanced CRM', 'Priority Support', 'Analytics'],
          active: true
        },
        {
          name: 'Enterprise Plan',
          price: 4999,
          maxUsers: 200,
          features: ['User Management', 'Full CRM Suite', '24/7 Support', 'Advanced Analytics', 'Custom Integrations'],
          active: true
        }
      ];
      
      await Plan.insertMany(testPlans);
      console.log('✅ Test plans created successfully!');
      
      const newPlans = await Plan.find();
      console.log('📊 Created plans:');
      newPlans.forEach(plan => {
        console.log(`   - ${plan.name}: ₹${plan.price} (${plan.maxUsers} users)`);
      });
    } else {
      console.log('📊 Existing plans:');
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.name}: ₹${plan.price} (${plan.maxUsers} users) - ${plan.active ? 'Active' : 'Inactive'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkAndCreatePlans(); 