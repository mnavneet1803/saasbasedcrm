import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col, Alert, Spinner, Badge, Form, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const PlanSelection = () => {
  const [plans, setPlans] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState(false);
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
      setGateways(gatewaysData);
      setSelectedGateway(gatewaysData.length > 0 ? gatewaysData[0].name : "");
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!selectedGateway) {
      setError("Please select a payment gateway.");
      return;
    }
    
    setSubscribing(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/api/payments/checkout", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ planId, gateway: selectedGateway })
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
      setSubscribing(false);
    }
  };

  // Always render something, even if there are errors
  return (
    <Container className="mt-4">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-primary">Welcome to Your CRM Platform!</h2>
        <p className="text-muted">Choose a subscription plan to get started with your CRM system</p>
      </div>
      
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading plans and payment options...</p>
        </div>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <strong>Error:</strong> {error}
          <br />
          <small>Please try refreshing the page or contact support.</small>
        </Alert>
      )}
      
      {!loading && !error && gateways.length === 0 && (
        <Alert variant="warning">
          <strong>No Payment Gateways Available</strong>
          <br />
          Please contact your Super Admin to enable payment gateways.
        </Alert>
      )}
      
      {!loading && !error && gateways.length > 0 && (
        <Row className="mb-4">
          <Col md={6} lg={4}>
            <Form.Group>
              <Form.Label><strong>Payment Gateway</strong></Form.Label>
              <Form.Select 
                value={selectedGateway} 
                onChange={e => setSelectedGateway(e.target.value)}
                className="form-select-lg"
              >
                <option value="">Select Gateway</option>
                {gateways.map(g => (
                  <option key={g.name} value={g.name}>
                    {g.name.charAt(0).toUpperCase() + g.name.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}
      
      {!loading && !error && plans.length > 0 && (
        <Row>
          {plans.map(plan => (
            <Col lg={4} md={6} key={plan._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-primary text-white text-center">
                  <h4 className="mb-0">{plan.name}</h4>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <h3 className="text-success fw-bold">₹{plan.price}</h3>
                    <small className="text-muted">per month</small>
                  </div>
                  
                  <div className="mb-3">
                    <Badge bg="info" className="mb-2">
                      Up to {plan.maxUsers} users
                    </Badge>
                  </div>
                  
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-2">Features:</h6>
                    <ul className="list-unstyled">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 mt-auto"
                    disabled={subscribing || !selectedGateway}
                    onClick={() => handleSubscribe(plan._id)}
                  >
                    {subscribing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {!loading && !error && plans.length === 0 && (
        <div className="text-center py-5">
          <h4 className="text-muted">No active plans available</h4>
          <p className="text-muted">Please contact your Super Admin to create subscription plans.</p>
        </div>
      )}
      
      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-light rounded">
          <h6>Debug Info:</h6>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
          <p>Plans count: {plans.length}</p>
          <p>Gateways count: {gateways.length}</p>
          <p>Selected gateway: {selectedGateway || 'None'}</p>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={fetchPlansAndGateways}
            className="mt-2"
          >
            Retry API Calls
          </Button>
        </div>
      )}
    </Container>
  );
};

export default PlanSelection; 