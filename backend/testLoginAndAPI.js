const jwt = require('jsonwebtoken');

// Test login and API endpoints
const testLoginAndAPI = async () => {
  try {
    console.log('🧪 Testing login and API endpoints...');
    
    // First, login with test admin
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testadmin@gmail.com',
        password: 'password123'
      })
    });
    
    console.log('🔐 Login status:', loginRes.status);
    
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      console.log('✅ Login successful, token received');
      
      const token = loginData.token;
      
      // Test plans endpoint with real token
      console.log('📋 Testing plans endpoint...');
      const plansRes = await fetch('http://localhost:5000/api/plans/active', {
        headers: {
          'Authorization': `Bearer ${token}`
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
      
      // Test gateways endpoint with real token
      console.log('💳 Testing gateways endpoint...');
      const gatewaysRes = await fetch('http://localhost:5000/api/payments/gateways', {
        headers: {
          'Authorization': `Bearer ${token}`
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
      
    } else {
      const loginError = await loginRes.text();
      console.log('❌ Login failed:', loginError);
    }
    
  } catch (err) {
    console.error('❌ Test error:', err);
  }
};

testLoginAndAPI(); 