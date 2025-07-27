import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col, Alert, Spinner, Badge, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [activeGateway, setActiveGateway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlansAndGateways();
  }, []);

  const fetchPlansAndGateways = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching plans and gateways...');
      
      const token = localStorage.getItem('token');
      console.log('🔑 Token available:', !!token);
      console.log('🔑 Token length:', token ? token.length : 0);
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      
      const [plansRes, gatewaysRes] = await Promise.all([
        fetch("http://localhost:5000/api/plans/active", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/payments/gateways", {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      console.log('📋 Plans response:', plansRes.status, plansRes.ok);
      console.log('💳 Gateways response:', gatewaysRes.status, gatewaysRes.ok);
      
      let plansData = [];
      let gatewaysData = [];
      
      if (plansRes.ok) {
        plansData = await plansRes.json();
      } else {
        const plansError = await plansRes.text();
        console.error('❌ Plans API error:', plansError);
        setError(`Failed to load plans: ${plansRes.status} - ${plansError}`);
        return;
      }
      
      if (gatewaysRes.ok) {
        gatewaysData = await gatewaysRes.json();
      } else {
        const gatewaysError = await gatewaysRes.text();
        console.error('❌ Gateways API error:', gatewaysError);
        setError(`Failed to load gateways: ${gatewaysRes.status} - ${gatewaysError}`);
        return;
      }
      
      console.log('📊 Plans data:', plansData);
      console.log('🔌 Gateways data:', gatewaysData);
      
      setPlans(plansData);
      
      // Automatically select the first (and only) active gateway
      if (gatewaysData.length > 0) {
        setActiveGateway(gatewaysData[0]);
        console.log('✅ Auto-selected payment gateway:', gatewaysData[0].name);
      } else {
        setError('No active payment gateways available. Please contact your Super Admin.');
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!activeGateway) {
      setError("No active payment gateway available.");
      return;
    }
    
    setSubscribingPlanId(planId);
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/api/payments/checkout", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ 
          planId, 
          gateway: activeGateway.name 
        })
      });
      
      const data = await res.json();
      if (res.ok && data.session && data.session.url) {
        navigate(data.session.url); // mock redirect
      } else {
        setError(data.message || "Failed to start checkout");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header Section */}
      <div className="bg-white border-bottom shadow-sm">
        <Container>
          <div className="py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="fw-bold text-primary mb-1">CRM Platform</h1>
                <p className="text-muted mb-0">Choose the perfect plan for your business</p>
              </div>
              <div>
                <Button variant="outline-primary" onClick={() => navigate('/admin')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-5">
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {/* Payment Gateway Info */}
        {activeGateway && (
          <div className="text-center mb-4">
            <div className="bg-light rounded p-3 d-inline-block">
              <small className="text-muted">
                <i className="fas fa-credit-card me-2"></i>
                Payment via {activeGateway.name.charAt(0).toUpperCase() + activeGateway.name.slice(1)}
              </small>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <Row className="justify-content-center">
          {plans.map((plan, index) => (
            <Col lg={3} md={6} key={plan._id} className="mb-4">
              <Card 
                className={`h-100 shadow-sm border-0 ${index === 1 ? 'border-primary shadow-lg' : ''}`} 
                style={{ 
                  transform: index === 1 ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {index === 1 && (
                  <div className="bg-primary text-white text-center py-2">
                    <Badge bg="warning" className="fs-6">
                      ⭐ Popular
                    </Badge>
                  </div>
                )}
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h3 className="fw-bold mb-2">{plan.name}</h3>
                    <p className="text-muted mb-3">{getPlanDescription(plan.name)}</p>
                    <div className="mb-3">
                      <span className="display-6 fw-bold text-primary">₹{plan.price}</span>
                      <span className="text-muted">/month</span>
                    </div>
                    <small className="text-muted">{getPlanNotes(plan.name)}</small>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Features:</h6>
                    <ul className="list-unstyled">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="mb-2">
                          <i className="fas fa-check text-success me-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={index === 1 ? "primary" : "outline-primary"}
                    size="lg"
                    className="w-100"
                    disabled={subscribingPlanId === plan._id || !activeGateway}
                    onClick={() => handleSubscribe(plan._id)}
                    style={{ borderRadius: '8px' }}
                  >
                    {subscribingPlanId === plan._id ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing {plan.name}...
                      </>
                    ) : (
                      "Get Started Now"
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {plans.length === 0 && (
          <div className="text-center py-5">
            <h4 className="text-muted">No active plans available</h4>
            <p className="text-muted">Please contact your Super Admin to create subscription plans.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-5 pt-4">
          <p className="text-muted">
            All plans include 24/7 support and a 30-day money-back guarantee
          </p>
        </div>
      </Container>
    </div>
  );
};

// Helper functions for plan descriptions and notes
const getPlanDescription = (planName) => {
  const descriptions = {
    'Basic': 'Perfect for small businesses getting started',
    'Professional': 'Advanced features for growing teams',
    'Enterprise': 'Complete solution for large organizations',
    'premium': 'Premium features for established businesses'
  };
  return descriptions[planName] || 'Comprehensive CRM solution';
};

const getPlanNotes = (planName) => {
  const notes = {
    'Basic': 'Up to 500 users included',
    'Professional': 'Unlimited users with advanced features',
    'Enterprise': 'Custom features and dedicated support',
    'premium': 'Premium support and advanced analytics'
  };
  return notes[planName] || 'Flexible user limits';
};

export default PricingPage; 