import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Badge, Button, 
  Form, InputGroup, Alert, Spinner, Modal, Pagination,
  Dropdown, DropdownButton
} from "react-bootstrap";
import { getApi, postApi } from '../utils/api';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [currentPage, statusFilter, gatewayFilter, dateFilter]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : "",
        gateway: gatewayFilter !== "all" ? gatewayFilter : "",
        date: dateFilter !== "all" ? dateFilter : "",
        search: searchTerm.trim()
      });

      const response = await getApi(`/api/payments/transactions?${params.toString()}`);

      if (response) {
        const data = await response;
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
        setTotalTransactions(data.total);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getApi('/api/payments/stats');

      if (response) {
        const data = await response;
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'pending': 'warning',
      'failed': 'danger',
      'cancelled': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`bg-${color} bg-opacity-10 p-3 rounded me-3`}>
            <span className={`text-${color}`} style={{ fontSize: '1.5rem' }}>{icon}</span>
          </div>
          <div>
            <h4 className="mb-1 fw-bold">{value}</h4>
            <p className="text-muted mb-0">{title}</p>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Payment Management</h2>
          <p className="text-muted mb-0">Monitor all transactions and payment activities</p>
        </div>
        <Button variant="primary" onClick={fetchTransactions}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <StatCard
            title="Total Revenue"
            value={loading ? "Loading..." : `₹${(stats.totalRevenue || 0).toLocaleString()}`}
            icon="💰"
            color="success"
            subtitle="All time"
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Total Transactions"
            value={loading ? "Loading..." : (stats.totalTransactions || 0)}
            icon="📊"
            color="primary"
            subtitle="All transactions"
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Successful Payments"
            value={loading ? "Loading..." : (stats.successfulPayments || 0)}
            icon="✅"
            color="success"
            subtitle="Completed"
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Pending Payments"
            value={loading ? "Loading..." : (stats.pendingPayments || 0)}
            icon="⏳"
            color="warning"
            subtitle="Awaiting"
          />
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by user, plan, or transaction ID"
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      
                      // Clear existing timeout
                      if (searchTimeout) {
                        clearTimeout(searchTimeout);
                      }
                      
                      // Set new timeout for debounced search
                      const timeout = setTimeout(() => {
                        setCurrentPage(1);
                        fetchTransactions();
                      }, 500); // 500ms delay
                      
                      setSearchTimeout(timeout);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (searchTimeout) {
                          clearTimeout(searchTimeout);
                        }
                        setCurrentPage(1);
                        fetchTransactions();
                      }
                    }}
                  />
                  <Button variant="outline-secondary" onClick={handleSearch}>
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Gateway</Form.Label>
                <Form.Select
                  value={gatewayFilter}
                  onChange={(e) => setGatewayFilter(e.target.value)}
                >
                  <option value="all">All Gateways</option>
                  <option value="stripe">Stripe</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="paypal">PayPal</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Form.Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="outline-primary" onClick={handleSearch} className="w-100">
                <i className="fas fa-filter me-2"></i>
                Apply Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Transaction History</h5>
            <small className="text-muted">
              Showing {transactions.length} of {totalTransactions} transactions
            </small>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : transactions.length > 0 ? (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Gateway</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction._id} 
                      style={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }} 
                      onClick={() => handleTransactionClick(transaction)}
                      className="transaction-row"
                    >
                      <td>
                        <code className="text-primary">{transaction.transactionId}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{transaction.admin?.name || 'Unknown'}</strong>
                          <br />
                          <small className="text-muted">{transaction.admin?.email}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">{transaction.plan?.name}</Badge>
                      </td>
                      <td>
                        <strong className="text-success">₹{transaction.amount}</strong>
                      </td>
                      <td>
                        <span className="text-capitalize">{transaction.gateway}</span>
                      </td>
                      <td>
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td>
                        <small>{formatDate(transaction.createdAt)}</small>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransactionClick(transaction);
                          }}
                          style={{ 
                            minWidth: '32px',
                            height: '32px',
                            padding: '4px 8px'
                          }}
                        >
                          <i className="fas fa-eye" style={{ fontSize: '12px' }}></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Pagination.Item>
                        );
                      } else if (page === currentPage - 3 || page === currentPage + 3) {
                        return <Pagination.Ellipsis key={page} />;
                      }
                      return null;
                    })}
                    
                    <Pagination.Next 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-receipt text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">No transactions found</h5>
              <p className="text-muted">No transactions match your current filters.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Transaction Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div>
              <Row>
                <Col md={6}>
                  <h6>Transaction Information</h6>
                  <p><strong>ID:</strong> {selectedTransaction.transactionId}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedTransaction.status)}</p>
                  <p><strong>Amount:</strong> ₹{selectedTransaction.amount}</p>
                  <p><strong>Gateway:</strong> {selectedTransaction.gateway}</p>
                  <p><strong>Date:</strong> {formatDate(selectedTransaction.createdAt)}</p>
                </Col>
                <Col md={6}>
                  <h6>User Information</h6>
                  <p><strong>Name:</strong> {selectedTransaction.admin?.name}</p>
                  <p><strong>Email:</strong> {selectedTransaction.admin?.email}</p>
                  <p><strong>Role:</strong> {selectedTransaction.admin?.role}</p>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col md={12}>
                  <h6>Plan Details</h6>
                  <p><strong>Plan:</strong> {selectedTransaction.plan?.name}</p>
                  <p><strong>Price:</strong> ₹{selectedTransaction.plan?.price}</p>
                  <p><strong>Features:</strong> {selectedTransaction.plan?.features?.join(', ')}</p>
                </Col>
              </Row>
              {selectedTransaction.gatewayResponse && (
                <>
                  <hr />
                  <Row>
                    <Col md={12}>
                      <h6>Gateway Response</h6>
                      <pre className="bg-light p-3 rounded">
                        {JSON.stringify(selectedTransaction.gatewayResponse, null, 2)}
                      </pre>
                    </Col>
                  </Row>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom CSS for better button styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .btn-outline-primary:hover {
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
            color: white !important;
          }
          .btn-outline-primary:focus {
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
          }
          .table-hover tbody tr:hover {
            background-color: rgba(0, 0, 0, 0.075) !important;
          }
          .transaction-row:hover {
            background-color: #f8f9fa !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          .transaction-row:hover .btn-outline-primary {
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
            color: white !important;
          }
        `
      }} />
    </Container>
  );
};

export default Payments; 
