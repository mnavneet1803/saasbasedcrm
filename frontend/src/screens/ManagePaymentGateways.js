import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Alert, 
  Spinner,
  Badge,
  InputGroup
} from 'react-bootstrap';
import { getApi, postApi } from '../utils/api';

const ManagePaymentGateways = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    enabled: false,
    config: {}
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const response = await getApi('/api/payment-gateways');
      if (response) {
        setGateways(response);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch payment gateways');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingGateway 
        ? `/api/payment-gateways/${editingGateway._id}`
        : '/api/payment-gateways';
      
      const method = editingGateway ? 'PUT' : 'POST';
      
      const response = await postApi(url, formData);
      
      const data = response.data;
      if (response.success) {
        setShowModal(false);
        setEditingGateway(null);
        setFormData({ name: '', enabled: false, config: {} });
        fetchGateways();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save payment gateway');
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      enabled: gateway.enabled,
      config: gateway.config || {}
    });
    setShowModal(true);
  };

  const handleToggle = async (gatewayId) => {
    try {
      const response = await postApi(`/api/payment-gateways/${gatewayId}/toggle`, {});
      
      if (response.success) {
        fetchGateways();
      } else {
        const data = response.data;
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to toggle gateway status');
    }
  };

  const handleDelete = async (gatewayId) => {
    if (!window.confirm('Are you sure you want to delete this payment gateway?')) {
      return;
    }
    
    try {
      const response = await postApi(`/payment-gateways/${gatewayId}`, { _method: 'DELETE' });
      
      if (response.success) {
        fetchGateways();
      } else {
        const data = response.data;
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete payment gateway');
    }
  };

  const filteredGateways = gateways.filter(gateway =>
    gateway.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Payment Gateway Management</h4>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add Gateway
              </Button>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
              
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Note:</strong> Only one payment gateway can be active at a time. Enabling a gateway will automatically disable others.
              </Alert>
              
              <InputGroup className="mb-3">
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search gateways..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Gateway Name</th>
                    <th>Status</th>
                    <th>Configuration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGateways.map((gateway) => (
                    <tr key={gateway._id}>
                      <td>
                        <strong>{gateway.name}</strong>
                      </td>
                      <td>
                        <Badge bg={gateway.enabled ? 'success' : 'secondary'}>
                          {gateway.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">
                          {Object.keys(gateway.config || {}).length > 0 
                            ? `${Object.keys(gateway.config).length} config items`
                            : 'No configuration'
                          }
                        </small>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant={gateway.enabled ? 'warning' : 'success'}
                          className="me-2"
                          onClick={() => handleToggle(gateway._id)}
                        >
                          {gateway.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-2"
                          onClick={() => handleEdit(gateway)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(gateway._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {filteredGateways.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">No payment gateways found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditingGateway(null);
        setFormData({ name: '', enabled: false, config: {} });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Gateway Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., stripe, razorpay"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="enabled-switch"
                label="Enable Gateway"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Configuration (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder='{"apiKey": "your-api-key", "secretKey": "your-secret-key"}'
                value={JSON.stringify(formData.config, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setFormData({ ...formData, config });
                  } catch (err) {
                    // Invalid JSON, keep as is
                  }
                }}
              />
              <Form.Text className="text-muted">
                Enter gateway configuration as JSON (optional)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingGateway ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManagePaymentGateways; 