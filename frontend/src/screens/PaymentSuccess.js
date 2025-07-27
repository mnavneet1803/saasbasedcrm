import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Spinner, Alert, Container } from "react-bootstrap";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tx = params.get("tx");
    if (tx) {
      confirmPayment(tx);
    } else {
      setError("No transaction found.");
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  const confirmPayment = async (tx) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/payments/success", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tx })
      });
      const data = await res.json();
      if (res.ok && data.transaction) {
        setTransaction(data.transaction);
        
        // Update user profile to reflect new subscription
        try {
          const profileRes = await fetch("http://localhost:5000/api/users/profile", {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (profileRes.ok) {
            const userData = await profileRes.json();
            // Store updated user data in localStorage to trigger Layout re-render
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Dispatch custom event to notify Layout component
            window.dispatchEvent(new CustomEvent('subscriptionUpdated', { 
              detail: { hasSubscription: true } 
            }));
          }
        } catch (err) {
          console.error('Error updating user profile:', err);
        }
        
        // Auto redirect to dashboard after 3 seconds
        setTimeout(() => {
          setRedirecting(true);
          navigate("/admin");
        }, 3000);
      } else {
        setError(data.message || "Payment confirmation failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    setRedirecting(true);
    navigate("/admin");
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Processing payment...</span>
          </Spinner>
          <p className="mt-2">Processing your payment...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <h4>Payment Error</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate("/admin/plans")}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <Card className="shadow p-4" style={{ maxWidth: 500, width: "100%" }}>
          <Card.Body className="text-center">
            <div className="mb-4">
              <div className="text-success" style={{ fontSize: '4rem' }}>✅</div>
              <h3 className="text-success fw-bold mb-3">Payment Successful!</h3>
              <p className="text-muted">Your subscription is now active and you can access all features.</p>
            </div>
            
            <hr />
            
            <div className="text-start">
              <h5>Plan: {transaction?.planName}</h5>
              <p>Amount Paid: <strong>₹{transaction?.amount}</strong></p>
              <p>Gateway: <strong>{transaction?.gateway}</strong></p>
              <p>Date: {transaction && new Date(transaction.date).toLocaleString()}</p>
            </div>
            
            <div className="mt-4">
              {redirecting ? (
                <div>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Redirecting to dashboard...
                </div>
              ) : (
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100" 
                  onClick={handleGoToDashboard}
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
            
            <div className="mt-3">
              <small className="text-muted">
                You will be automatically redirected to the dashboard in a few seconds.
              </small>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default PaymentSuccess; 