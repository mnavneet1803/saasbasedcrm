import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Container } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';

const SubscriptionCheck = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/users/profile", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const isSubscribed = userData.plan && userData.status === 'active';
        setHasSubscription(isSubscribed);
        
        if (!isSubscribed && user?.role === 'admin') {
          // Redirect to plans page if admin has no active subscription
          navigate('/admin/plans');
          return;
        }
      } else {
        setError('Failed to check subscription status');
      }
    } catch (err) {
      setError('Network error while checking subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Checking subscription...</span>
          </Spinner>
          <p className="mt-2">Checking subscription status...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  // Only render children if user has subscription or is superadmin
  if (hasSubscription || user?.role === 'superadmin') {
    return children;
  }

  // This should not be reached as we redirect to plans above
  return null;
};

export default SubscriptionCheck; 