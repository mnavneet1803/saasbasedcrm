import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Button, Modal, Form, 
  Alert, Spinner, Badge, Dropdown, DropdownButton
} from "react-bootstrap";

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [admins, setAdmins] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: ''
  });
  
  // Validation states
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchAdmins();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users?role=user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users?role=admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err);
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status
        })
      });

      if (response.ok) {
        const data = await response.json();
        setError('');
        setShowEditModal(false);
        setFormData({ name: '', email: '', phone: '', status: '' });
        setSelectedUser(null);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update user status');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (response.ok) {
        setError('');
        alert('Password reset successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user._id}/activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setShowActivitiesModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch activities');
      }
    } catch (err) {
      setError('Network error');
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

  const getAdminName = (createdBy) => {
    if (!createdBy) return 'Unknown';
    // If createdBy is already populated (object), use it directly
    if (typeof createdBy === 'object' && createdBy.name) {
      return createdBy.name;
    }
    // If createdBy is just an ID, find the admin in the admins array
    const admin = admins.find(a => a._id === createdBy);
    return admin ? admin.name : 'Unknown';
  };

  const filteredUsers = users.filter(user => {
    const matchesName = !nameFilter || user.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesEmail = !emailFilter || user.email.toLowerCase().includes(emailFilter.toLowerCase());
    const matchesStatus = !statusFilter || user.status === statusFilter;
    const matchesAdmin = !adminFilter || getAdminName(user.createdBy).toLowerCase().includes(adminFilter.toLowerCase());
    
    return matchesName && matchesEmail && matchesStatus && matchesAdmin;
  });

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
          <h2 className="fw-bold mb-1">All Users Management</h2>
          <p className="text-muted mb-0">Monitor all users created by all admins</p>
        </div>
        <Button variant="outline-primary" onClick={fetchUsers}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Filters</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Created By Admin</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by admin name"
                  value={adminFilter}
                  onChange={(e) => setAdminFilter(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setNameFilter("");
                    setEmailFilter("");
                    setStatusFilter("");
                    setAdminFilter("");
                  }}
                  className="w-100"
                >
                  Clear
                </Button>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">All Users ({filteredUsers.length})</h5>
            <small className="text-muted">Showing users from all admins</small>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredUsers.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th style={{ width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
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
                      <small className="text-muted">{getAdminName(user.createdBy)}</small>
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
              <p className="text-muted">No users match the current filters.</p>
            </div>
          )}
        </Card.Body>
      </Card>

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
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </Form.Select>
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

export default SuperAdminUsers; 