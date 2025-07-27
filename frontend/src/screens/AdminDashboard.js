import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Spinner } from "react-bootstrap";

const AdminDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Re-check subscription status when dashboard loads (after payment)
  useEffect(() => {
    const checkSubscriptionStatus = () => {
      fetch("http://localhost:5000/api/users/profile", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(userData => {
        if (userData.plan && userData.status === 'active') {
          // Dispatch event to update Layout sidebar
          window.dispatchEvent(new CustomEvent('subscriptionUpdated', { 
            detail: { hasSubscription: true } 
          }));
        }
      })
      .catch(err => console.error('Error checking subscription:', err));
    };

    checkSubscriptionStatus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users/profile", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold text-primary">Welcome back, {userData?.name}!</h2>
              <p className="text-muted">Manage your CRM platform and users</p>
            </div>
            <div>
              {userData?.plan && (
                <Badge bg="success" className="fs-6">
                  {userData.plan.name} Plan
                </Badge>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-users text-primary fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-1">My Users</h5>
                  <p className="text-muted mb-0">Manage your team members</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-chart-line text-success fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-1">CRM Data</h5>
                  <p className="text-muted mb-0">View and manage CRM information</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-credit-card text-info fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-1">Billing History</h5>
                  <p className="text-muted mb-0">View your payment history</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {userData?.plan && (
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Current Subscription</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Plan Details</h6>
                    <p><strong>Plan:</strong> {userData.plan.name}</p>
                    <p><strong>Price:</strong> ₹{userData.plan.price}/month</p>
                    <p><strong>Max Users:</strong> {userData.plan.maxUsers}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Features</h6>
                    <ul className="list-unstyled">
                      {userData.plan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          {feature}
                        </li>
                      ))}
                      {userData.plan.features.length > 5 && (
                        <li className="text-muted">
                          +{userData.plan.features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AdminDashboard; 