const jwt = require('jsonwebtoken');

// Create a test token for admin
const testToken = jwt.sign(
  { id: 'test', role: 'admin' }, 
  'your_super_secret_jwt_key_for_saas_crm_project_2024'
);

console.log('🔑 Test token:', testToken);

// Test the API endpoints
const testAPI = async () => {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test plans endpoint
    const plansRes = await fetch('http://localhost:5000/api/plans/active', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('📋 Plans endpoint status:', plansRes.status);
    if (plansRes.ok) {
      const plansData = await plansRes.json();
      console.log('✅ Plans data:', plansData);
    } else {
      const error = await plansRes.text();
      console.log('❌ Plans error:', error);
    }
    
    // Test gateways endpoint
    const gatewaysRes = await fetch('http://localhost:5000/api/payments/gateways', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('💳 Gateways endpoint status:', gatewaysRes.status);
    if (gatewaysRes.ok) {
      const gatewaysData = await gatewaysRes.json();
      console.log('✅ Gateways data:', gatewaysData);
    } else {
      const error = await gatewaysRes.text();
      console.log('❌ Gateways error:', error);
    }
    
  } catch (err) {
    console.error('❌ API test error:', err);
  }
};

testAPI(); 