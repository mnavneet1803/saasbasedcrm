import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Button, Table, Modal, Form, Alert,
  Badge, Spinner, InputGroup
} from "react-bootstrap";

const FEATURE_OPTIONS = [
  "User Management",
  "CRM Analytics",
  "Payment Processing",
  "Advanced Reporting",
  "API Access",
  "Custom Branding",
  "Priority Support",
  "Data Export",
  "Team Collaboration",
  "Mobile App Access"
];

const ManagePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    maxUsers: "",
    features: [],
    active: true
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    active: ""
  });
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line
  }, []);

  const fetchPlans = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`http://localhost:5000/api/plans${query ? `?${query}` : ""}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        setError('Failed to fetch plans');
      }
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
    fetchPlans(filters).then(() => setFiltering(false));
  };

  const handleClearFilters = () => {
    setFilters({ name: "", active: "" });
    fetchPlans();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const url = editingPlan
        ? `http://localhost:5000/api/plans/${editingPlan._id}`
        : 'http://localhost:5000/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setSuccess(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        setShowModal(false);
        setEditingPlan(null);
        setFormData({ name: "", price: "", maxUsers: "", features: [], active: true });
        fetchPlans(filters);
      } else {
        const data = await response.json();
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This will affect all admins using this plan.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/plans/${planId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          setSuccess('Plan deleted successfully');
          fetchPlans(filters);
        } else {
          setError('Failed to delete plan');
        }
      } catch (error) {
        setError('Network error');
      }
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      maxUsers: plan.maxUsers.toString(),
      features: plan.features || [],
      active: plan.active
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    setFormData({ name: "", price: "", maxUsers: "", features: [], active: true });
    setShowModal(true);
  };

  const handleFeatureToggle = (feature) => {
    const newFeatures = formData.features.includes(feature)
      ? formData.features.filter(f => f !== feature)
      : [...formData.features, feature];
    setFormData({ ...formData, features: newFeatures });
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
          <h2 className="fw-bold mb-1">Manage Plans</h2>
          <p className="text-muted mb-0">Create and manage CRM subscription plans</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <span className="me-2">➕</span>
          Add New Plan
        </Button>
      </div>

      {/* Search/Filter Controls */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleFilter} className="row g-2 align-items-end">
            <Col md={4}>
              <Form.Label>Plan Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Search by plan name"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="active"
                value={filters.active}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3} className="d-flex gap-2">
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
          <h5 className="mb-0">Subscription Plans</h5>
        </Card.Header>
        <Card.Body>
          {plans.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Max Users</th>
                  <th>Features</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                          <span className="text-primary">📦</span>
                        </div>
                        <strong>{plan.name}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>₹{plan.price}</strong>
                      <br />
                      <small className="text-muted">per month</small>
                    </td>
                    <td>
                      <Badge bg="info">{plan.maxUsers} users</Badge>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} bg="secondary" className="small">
                            {feature}
                          </Badge>
                        ))}
                        {plan.features.length > 3 && (
                          <Badge bg="light" text="dark" className="small">
                            +{plan.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg={plan.active ? "success" : "secondary"}>
                        {plan.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(plan._id)}
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
              <p className="text-muted mb-0">No plans found</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPlan ? 'Edit Plan' : 'Add New Plan'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Plan Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (INR)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Users</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxUsers"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="active-switch"
                    label="Active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Features</Form.Label>
              <div className="row">
                {FEATURE_OPTIONS.map((feature) => (
                  <Col md={6} key={feature}>
                    <Form.Check
                      type="checkbox"
                      id={`feature-${feature}`}
                      label={feature}
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                    />
                  </Col>
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagePlans; 