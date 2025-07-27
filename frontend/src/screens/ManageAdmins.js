import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Button, Table, Modal, Form, Alert,
  Badge, Spinner, InputGroup
} from "react-bootstrap";
import { getApi, postApi } from '../utils/api';

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    plan: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    status: "",
    plan: ""
  });
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    fetchAdmins();
    fetchPlans();
    // eslint-disable-next-line
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await getApi('/api/plans');
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchAdmins = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(params).toString();
      const data = await getApi(`/api/admins${query ? `?${query}` : ""}`);
      setAdmins(data);
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setFiltering(true);
    fetchAdmins(filters).then(() => setFiltering(false));
  };

  const handleClearFilters = () => {
    setFilters({ name: "", email: "", status: "", plan: "" });
    fetchAdmins();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const url = editingAdmin
        ? `/api/admins/${editingAdmin._id}`
        : '/api/admins';
      const method = editingAdmin ? 'PUT' : 'POST';
      const body = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        plan: formData.plan
      };
      let data;
      if (method === 'PUT') {
        data = await postApi(url, body, { method: 'PUT' });
      } else {
        data = await postApi(url, body);
      }
      setSuccess(editingAdmin ? 'Admin updated successfully' : 'Admin created successfully');
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      setError(error.message || 'Failed to save admin');
    }
  };

  const handleDelete = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await postApi(`/api/admins/${adminId}`, {}, { method: 'DELETE' });
        fetchAdmins();
      } catch (error) {
        setError('Failed to delete admin');
      }
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      plan: admin.plan?._id || ""
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingAdmin(null);
    setFormData({ name: "", email: "", password: "", plan: "" });
    setShowModal(true);
  };

  const handleBlockUnblock = async (admin) => {
    const newStatus = admin.status === "active" ? "blocked" : "active";
    try {
      await postApi(`/api/admins/${admin._id}/status`, { status: newStatus }, { method: 'PATCH' });
      fetchAdmins();
    } catch (error) {
      setError('Failed to update status');
    }
  };

  if (loading || filtering) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Manage Admins</h2>
          <p className="text-muted mb-0">Create, block/unblock, and manage administrator accounts</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <span className="me-2">➕</span>
          Add New Admin
        </Button>
      </div>

      {/* Search/Filter Controls */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleFilter} className="row g-2 align-items-end">
            <Col md={3}>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Search by name"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="text"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="Search by email"
              />
            </Col>
            <Col md={2}>
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Plan</Form.Label>
              <Form.Select
                name="plan"
                value={filters.plan}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {plans.map(plan => (
                  <option key={plan._id} value={plan._id}>{plan.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="d-flex gap-2">
              <Button type="submit" variant="primary">Search</Button>
              <Button type="button" variant="outline-secondary" onClick={handleClearFilters}>Clear</Button>
            </Col>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Administrators</h5>
        </Card.Header>
        <Card.Body>
          {admins.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                          <span className="text-primary">👤</span>
                        </div>
                        <strong>{admin.name}</strong>
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <Badge bg={admin.status === "active" ? "success" : "secondary"}>{admin.status}</Badge>
                    </td>
                    <td>
                      {admin.plan ? (
                        <Badge bg="info">{admin.plan.name}</Badge>
                      ) : (
                        <Badge bg="light" text="dark">No Plan</Badge>
                      )}
                    </td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant={admin.status === "active" ? "outline-secondary" : "outline-success"}
                        size="sm"
                        className="me-2"
                        onClick={() => handleBlockUnblock(admin)}
                      >
                        {admin.status === "active" ? "Block" : "Unblock"}
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(admin)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(admin._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No administrators found</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingAdmin ? "Leave blank to keep current password" : "Enter password"}
                required={!editingAdmin}
              />
              {editingAdmin && (
                <Form.Text className="text-muted">
                  Leave blank to keep the current password
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Plan</Form.Label>
              <Form.Select
                name="plan"
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              >
                <option value="">Select a plan</option>
                {plans.filter(plan => plan.active).map(plan => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - ${plan.price}/month
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingAdmin ? 'Update Admin' : 'Create Admin'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageAdmins; 