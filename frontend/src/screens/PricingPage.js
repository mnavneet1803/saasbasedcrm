import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col, Alert, Spinner, Badge, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getApi, postApi } from '../utils/api';

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
      const plans = await getApi('/api/plans/active');
      const gateways = await getApi('/api/payments/gateways');
      setPlans(plans);
      if (gateways.length > 0) {
        setActiveGateway(gateways[0]);
      } else {
        setError('No active payment gateways available. Please contact your Super Admin.');
      }
    } catch (err) {
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
      const { session, message } = await postApi('/api/payments/checkout', {
        planId, 
        gateway: activeGateway.name 
      });
      if (session && session.url) {
        navigate(session.url); // mock redirect
      } else {
        setError(message || "Failed to start checkout");
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