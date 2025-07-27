const mongoose = require('mongoose');
const PaymentGateway = require('./models/PaymentGateway');

// MongoDB connection
mongoose.connect('mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedPaymentGateways = async () => {
  try {
    // Clear existing gateways
    await PaymentGateway.deleteMany({});
    
    // Create sample payment gateways
    const gateways = [
      {
        name: 'stripe',
        enabled: true,
        config: {
          publishableKey: 'pk_test_your_stripe_publishable_key',
          secretKey: 'sk_test_your_stripe_secret_key',
          webhookSecret: 'whsec_your_webhook_secret'
        }
      },
      {
        name: 'razorpay',
        enabled: true,
        config: {
          keyId: 'rzp_test_your_razorpay_key_id',
          keySecret: 'your_razorpay_key_secret',
          webhookSecret: 'your_webhook_secret'
        }
      },
      {
        name: 'paypal',
        enabled: false,
        config: {
          clientId: 'your_paypal_client_id',
          clientSecret: 'your_paypal_client_secret',
          mode: 'sandbox'
        }
      }
    ];
    
    await PaymentGateway.insertMany(gateways);
    console.log('✅ Payment gateways seeded successfully!');
    console.log('📋 Created gateways:');
    gateways.forEach(gateway => {
      console.log(`   - ${gateway.name} (${gateway.enabled ? 'Active' : 'Inactive'})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding payment gateways:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedPaymentGateways(); 