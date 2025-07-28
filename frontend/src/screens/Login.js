import React, { useState, useEffect } from "react";
import { Link ,useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { setToken,getToken } from "../utils/auth";
import useAuth from "../hooks/useAuth";
import { getApi, postApi } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't show login form if user is already authenticated
  if (user) {
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const checkAdminSubscription = async (token) => {
    try {
      const data = await getApi('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return data.plan && data.status === 'active';
    } catch (err) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await postApi('/api/auth/login', formData);
      if (data.token) {
        setToken(data.token);
        login(data.token);
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (payload.role === 'superadmin') {
          navigate('/superadmin');
        } else if (payload.role === 'admin') {
          const hasSubscription = await checkAdminSubscription(data.token);
          if (hasSubscription) {
            navigate('/admin');
          } else {
            navigate('/admin/plans');
          }
        } else if (payload.role === 'user') {
          navigate('/user');
        } else {
          setError('Unauthorized role');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary">CRM Login</h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>
                
                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-decoration-none">Sign Up</Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login; 
