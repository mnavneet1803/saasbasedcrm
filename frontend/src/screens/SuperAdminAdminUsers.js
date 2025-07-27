import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Button, Modal, Form, 
  Alert, Spinner, Badge, Dropdown, DropdownButton, Tabs, Tab
} from "react-bootstrap";
import { getApi, postApi } from '../utils/api';

const SuperAdminAdminUsers = () => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active'
  });
  
  // Transfer form state
  const [transferData, setTransferData] = useState({
    targetAdminId: ''
  });
  
  // Validation states
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (selectedAdmin) {
      fetchUsersForAdmin(selectedAdmin._id);
    }
  }, [selectedAdmin]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { users } = await getApi('/api/users?role=admin');
      setAdmins(users);
      if (users.length > 0) {
        setSelectedAdmin(users[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForAdmin = async (adminId) => {
    try {
      const { users } = await getApi(`/api/users/by-admin/${adminId}`);
      setUsers(users);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
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
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await postApi('/api/users', {
        ...formData,
        role: 'user',
        createdBy: selectedAdmin._id
      });

      if (response) {
        const { users } = response;
        setError('');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', phone: '', password: '', status: 'active' });
        fetchUsersForAdmin(selectedAdmin._id);
      } else {
        const errorData = response;
        setError(errorData.message || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await postApi(`/api/users/${selectedUser._id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status
      });

      if (response) {
        const { data } = response;
        setError('');
        setShowEditModal(false);
        setFormData({ name: '', email: '', phone: '', password: '', status: 'active' });
        setSelectedUser(null);
        fetchUsersForAdmin(selectedAdmin._id);
      } else {
        const errorData = response.data;
        setError(errorData.message || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await postApi(`/api/users/${userId}/toggle-status`);

      if (response.ok) {
        fetchUsersForAdmin(selectedAdmin._id);
      } else {
        const errorData = response.data;
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
      const response = await postApi(`/api/users/${userId}/reset-password`, { newPassword });

      if (response.ok) {
        setError('');
        alert('Password reset successfully');
      } else {
        const errorData = response.data;
        setError(errorData.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleTransferUser = async (e) => {
    e.preventDefault();
    
    if (!transferData.targetAdminId) {
      setError('Please select a target admin');
      return;
    }

    try {
      const response = await postApi(`/api/users/${selectedUser._id}/transfer`, {
        targetAdminId: transferData.targetAdminId
      });

      if (response.ok) {
        setError('');
        setShowTransferModal(false);
        setTransferData({ targetAdminId: '' });
        setSelectedUser(null);
        fetchUsersForAdmin(selectedAdmin._id);
      } else {
        const errorData = response.data;
        setError(errorData.message || 'Failed to transfer user');
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
      password: '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    try {
      const { activities } = await getApi(`/api/users/${user._id}/activities`);
      setActivities(activities);
      setShowActivitiesModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch activities');
    }
  };

  const handleTransferUserClick = (user) => {
    setSelectedUser(user);
    setTransferData({ targetAdminId: '' });
    setShowTransferModal(true);
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

  const filteredUsers = users.filter(user => {
    const matchesName = !nameFilter || user.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesEmail = !emailFilter || user.email.toLowerCase().includes(emailFilter.toLowerCase());
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesName && matchesEmail && matchesStatus;
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
          <h2 className="fw-bold mb-1">Admin → Users Management</h2>
          <p className="text-muted mb-0">Manage users under specific admins</p>
        </div>
        <Button variant="outline-primary" onClick={fetchAdmins}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Admin Selection */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Select Admin</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Choose Admin</Form.Label>
                <Form.Select
                  value={selectedAdmin?._id || ''}
                  onChange={(e) => {
                    const admin = admins.find(a => a._id === e.target.value);
                    setSelectedAdmin(admin);
                  }}
                >
                  <option value="">Select an admin</option>
                  {admins.map(admin => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              {selectedAdmin && (
                <div className="d-flex align-items-center h-100">
                  <div>
                    <h6 className="mb-1">{selectedAdmin.name}</h6>
                    <small className="text-muted">{selectedAdmin.email}</small>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {selectedAdmin && (
        <>
          {/* Tabs */}
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
            <Tab eventKey="overview" title="Overview">
              <Row>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h3 className="text-primary">{users.length}</h3>
                      <p className="text-muted mb-0">Total Users</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h3 className="text-success">{users.filter(u => u.status === 'active').length}</h3>
                      <p className="text-muted mb-0">Active Users</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h3 className="text-danger">{users.filter(u => u.status === 'blocked').length}</h3>
                      <p className="text-muted mb-0">Blocked Users</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h3 className="text-info">{users.filter(u => !u.lastLogin).length}</h3>
                      <p className="text-muted mb-0">Never Logged In</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="users" title="Users Management">
              {/* Filters */}
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Filters</h6>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Create User
                    </Button>
                  </div>
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
                    <Col md={3}>
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
                        <Form.Label>&nbsp;</Form.Label>
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => {
                            setNameFilter("");
                            setEmailFilter("");
                            setStatusFilter("");
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
                    <h5 className="mb-0">Users under {selectedAdmin.name} ({filteredUsers.length})</h5>
                    <small className="text-muted">Full CRUD access</small>
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
                          <th>Created</th>
                          <th>Last Login</th>
                          <th style={{ width: '180px' }}>Actions</th>
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
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleTransferUserClick(user)}
                                  className="action-btn"
                                  title="Transfer User"
                                >
                                  <i className="fas fa-exchange-alt"></i>
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
                      <p className="text-muted">This admin hasn't created any users yet.</p>
                      <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus me-2"></i>
                        Create First User
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </>
      )}

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create User under {selectedAdmin?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
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
            <Row>
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
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
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

      {/* Transfer User Modal */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Transfer User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransferUser}>
          <Modal.Body>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Transfer <strong>{selectedUser?.name}</strong> to another admin
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Target Admin *</Form.Label>
              <Form.Select
                value={transferData.targetAdminId}
                onChange={(e) => setTransferData({...transferData, targetAdminId: e.target.value})}
                isInvalid={!!errors.targetAdminId}
              >
                <option value="">Select target admin</option>
                {admins.filter(admin => admin._id !== selectedAdmin?._id).map(admin => (
                  <option key={admin._id} value={admin._id}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.targetAdminId}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Transfer User
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

export default SuperAdminAdminUsers; 