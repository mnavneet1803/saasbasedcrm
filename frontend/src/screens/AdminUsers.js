import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Button, Modal, Form, 
  Alert, Spinner, Badge, Dropdown, DropdownButton
} from "react-bootstrap";
import { getApi, postApi } from '../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  
  // Validation states
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
     const data = await getApi('/api/admin/users');
      if (!data.message) {
        setUsers(users);
      }else{
        setError(data.message)
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password && !selectedUser) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const url = selectedUser 
        ? `/api/admin/users/${selectedUser._id}`
        : '/api/admin/users';
      
      const method = selectedUser ? 'PUT' : 'POST';
      const body = selectedUser 
        ? { name: formData.name, email: formData.email, phone: formData.phone }
        : formData;
      
      await postApi(url, body, { method });

      setError('');
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await postApi(`/api/admin/users/${userId}/toggle-status`, {}, { method: 'PATCH' });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await postApi(`/api/admin/users/${userId}/reset-password`, { newPassword }, { method: 'PATCH' });
      setError('');
      alert('Password reset successfully');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    try {
      const { activities } = await getApi(`/api/admin/users/${user._id}/activities`);
      setActivities(activities);
      setShowActivitiesModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch activities');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    return (
      <Badge bg={status === 'active' ? 'success' : 'danger'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">User Management</h2>
          <p className="text-muted mb-0">Manage your team members and their access</p>
        </div>
        <Button disabled={error.length} variant="primary" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus me-2"></i>
          Add New User
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">My Users ({users.length})</h5>
            <Button disabled={error.length} variant="outline-primary" size="sm" onClick={fetchUsers}>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {users.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th style={{ width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div>
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">{user.email}</small>
                    </td>
                    <td>
                      <small className="text-muted">{user.phone || 'N/A'}</small>
                    </td>
                    <td>
                      {getStatusBadge(user.status)}
                    </td>
                    <td>
                      <small>{formatDate(user.createdAt)}</small>
                    </td>
                    <td>
                      <small className="text-muted">Never</small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="action-btn"
                          title="Edit User"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewActivities(user)}
                          className="action-btn"
                          title="View Activities"
                        >
                          <i className="fas fa-chart-line"></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleResetPassword(user._id)}
                          className="action-btn"
                          title="Reset Password"
                        >
                          <i className="fas fa-key"></i>
                        </Button>
                        <Button
                          variant={user.status === 'active' ? 'outline-danger' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleStatus(user._id)}
                          className="action-btn"
                          title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                        >
                          <i className={`fas fa-${user.status === 'active' ? 'ban' : 'check'}`}></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-users text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">No users found</h5>
              <p className="text-muted">Start by adding your first team member.</p>
              <Button disabled={error.length} variant="primary" onClick={() => setShowAddModal(true)}>
                Add First User
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Activities Modal */}
      <Modal show={showActivitiesModal} onHide={() => setShowActivitiesModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Activities - {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activities.length > 0 ? (
            <div>
              {activities.map((activity, index) => (
                <div key={index} className="border-bottom pb-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{activity.description}</h6>
                      <small className="text-muted">
                        {formatDate(activity.timestamp)}
                      </small>
                    </div>
                    <Badge bg="info">{activity.type}</Badge>
                  </div>
                  {activity.details && (
                    <div className="mt-2">
                      <small className="text-muted">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <span key={key} className="me-3">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-chart-line text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">No activities found</h5>
              <p className="text-muted">This user hasn't performed any activities yet.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivitiesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers; 
