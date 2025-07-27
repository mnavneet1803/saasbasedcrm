import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getToken } from '../utils/auth';
import { getApi } from '../utils/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = getToken();
        const res = await getApi('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res) {
          const data = await res;
          setProfile(data);
        } else {
          setError('Failed to fetch profile');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const admin = profile?.createdBy;

  return (
    <Row className="justify-content-center mt-4">
      <Col md={8} lg={6}>
        <Card className="shadow">
          <Card.Body>
            <h3 className="mb-3 text-primary">Welcome, {profile?.name || 'User'}!</h3>
            <p className="text-muted">This is your CRM user dashboard.</p>
            <hr />
            <h5>Your Assigned Admin</h5>
            {admin ? (
              <div className="mb-3">
                <div><strong>Name:</strong> {admin.name}</div>
                <div><strong>Email:</strong> {admin.email}</div>
              </div>
            ) : (
              <div className="text-danger mb-3">No admin assigned.</div>
            )}
            <Button variant="primary" onClick={() => navigate('/user/chat')} disabled={!admin}>
              Chat with Admin
            </Button>
            <hr />
            <h6 className="text-muted">Your Info</h6>
            <div><strong>Email:</strong> {profile?.email}</div>
            <div><strong>Status:</strong> {profile?.status}</div>
            <div><strong>Joined:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}</div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default UserDashboard; 