import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Badge, Table, ProgressBar, Container } from "react-bootstrap";
import { getApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalUsers: 0,
    totalPayments: 0,
    activeSubscriptions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    totalUserActivities: 0,
    // New stats for Phase 3.5
    totalAdminsWithUsers: 0,
    averageUsersPerAdmin: 0,
    userGrowthRate: 0,
    inactiveUsers: 0,
    userActivityRate: 0
  });

  const [recentPayments, setRecentPayments] = useState([]);
  const [recentAdmins, setRecentAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsData = await getApi('/api/dashboard/stats');
      setStats(statsData);

      // Fetch recent payments
      const paymentsData = await getApi('/api/payments/transactions?limit=5');
      setRecentPayments(paymentsData.transactions || []);

      // Fetch recent admins
      const adminsData = await getApi('/api/users?role=admin&limit=5');
      setRecentAdmins(adminsData.users || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`bg-${color} bg-opacity-10 p-3 rounded me-3`}>
            <span className={`text-${color}`} style={{ fontSize: '1.5rem' }}>{icon}</span>
          </div>
          <div className="flex-grow-1">
            <h4 className="mb-1 fw-bold">{value}</h4>
            <p className="text-muted mb-0">{title}</p>
            {subtitle && <small className="text-muted">{subtitle}</small>}
            {trend && (
              <small className={`text-${trend > 0 ? 'success' : 'danger'}`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from last month
              </small>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Super Admin Dashboard</h2>
          <p className="text-muted mb-0">Manage your CRM platform and monitor all activities</p>
        </div>
        <Button variant="primary" size="sm" onClick={fetchDashboardData}>
          <span className="me-2">🔄</span>
          Refresh Data
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <StatCard
            title="Total Revenue"
            value={loading ? "Loading..." : `₹${(stats.totalRevenue || 0).toLocaleString()}`}
            icon="💰"
            color="success"
            subtitle="All time earnings"
            trend={12}
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Monthly Revenue"
            value={loading ? "Loading..." : `₹${(stats.monthlyRevenue || 0).toLocaleString()}`}
            icon="💰"
            color="primary"
            subtitle="This month"
            trend={8}
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Active Subscriptions"
            value={loading ? "Loading..." : (stats.activeSubscriptions || 0)}
            icon="✅"
            color="info"
            subtitle="Current subscriptions"
            trend={15}
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Total Admins"
            value={loading ? "Loading..." : (stats.totalAdmins || 0)}
            icon="👥"
            color="warning"
            subtitle="Registered administrators"
            trend={5}
          />
        </Col>
      </Row>

      {/* Payment Statistics */}
      <Row className="mb-4">
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Payment Statistics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="text-center mb-3">
                    <h3 className="text-success fw-bold">{stats.successfulPayments || 0}</h3>
                    <p className="text-muted mb-0">Successful Payments</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center mb-3">
                    <h3 className="text-warning fw-bold">{stats.pendingPayments || 0}</h3>
                    <p className="text-muted mb-0">Pending Payments</p>
                  </div>
                </Col>
              </Row>
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Success Rate</small>
                  <small>{(stats.totalPayments || 0) > 0 ? Math.round(((stats.successfulPayments || 0) / (stats.totalPayments || 1)) * 100) : 0}%</small>
                </div>
                <ProgressBar 
                  now={(stats.totalPayments || 0) > 0 ? ((stats.successfulPayments || 0) / (stats.totalPayments || 1)) * 100 : 0} 
                  variant="success" 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Platform Overview</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="text-center mb-3">
                    <h3 className="text-primary fw-bold">{stats.totalUsers || 0}</h3>
                    <p className="text-muted mb-0">Total Users</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center mb-3">
                    <h3 className="text-info fw-bold">{stats.totalPayments || 0}</h3>
                    <p className="text-muted mb-0">Total Transactions</p>
                  </div>
                </Col>
              </Row>
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Subscription Rate</small>
                  <small>{(stats.totalAdmins || 0) > 0 ? Math.round(((stats.activeSubscriptions || 0) / (stats.totalAdmins || 1)) * 100) : 0}%</small>
                </div>
                <ProgressBar 
                  now={(stats.totalAdmins || 0) > 0 ? ((stats.activeSubscriptions || 0) / (stats.totalAdmins || 1)) * 100 : 0} 
                  variant="info" 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row className="mb-4">
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Recent Payments</h5>
            </Card.Header>
            <Card.Body>
              {recentPayments.length > 0 ? (
                <div>
                  {recentPayments.map((payment, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                      <div>
                        <strong>{payment.admin?.name || 'Unknown User'}</strong>
                        <br />
                        <small className="text-muted">{payment.plan?.name} • {formatDate(payment.createdAt)}</small>
                      </div>
                      <div className="text-end">
                        <strong className="text-success">₹{payment.amount}</strong>
                        <br />
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button variant="outline-primary" size="sm" onClick={() => navigate('/superadmin/payments')}>
                      View All Payments
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center mb-0">No recent payments</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-warning text-white">
              <h5 className="mb-0">Recent Admins</h5>
            </Card.Header>
            <Card.Body>
              {recentAdmins.length > 0 ? (
                <div>
                  {recentAdmins.map((admin, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                      <div>
                        <strong>{admin.name}</strong>
                        <br />
                        <small className="text-muted">{admin.email}</small>
                      </div>
                      <div className="text-end">
                        <Badge bg={admin.status === 'active' ? 'success' : 'secondary'}>
                          {admin.status}
                        </Badge>
                        <br />
                        <small className="text-muted">{admin.plan?.name || 'No Plan'}</small>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button variant="outline-warning" size="sm" onClick={() => navigate('/superadmin/admins')}>
                      View All Admins
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center mb-0">No recent admins</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Activities Overview */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">User Activities Overview</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-info fw-bold">{stats.totalUserActivities || 0}</h3>
                    <p className="text-muted mb-0">Total Activities</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-success fw-bold">{stats.activeUsers || 0}</h3>
                    <p className="text-muted mb-0">Active Users</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary fw-bold">{stats.totalUsers || 0}</h3>
                    <p className="text-muted mb-0">Total Users</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-warning fw-bold">{stats.totalAdmins || 0}</h3>
                    <p className="text-muted mb-0">Total Admins</p>
                  </div>
                </Col>
              </Row>
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-1">
                  <small>User Engagement Rate</small>
                  <small>{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</small>
                </div>
                <ProgressBar 
                  now={stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0} 
                  variant="info" 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Phase 3.5: Admin-User Management Stats */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Admin → Users Management</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2}>
                  <div className="text-center">
                    <h3 className="text-success fw-bold">{stats.totalAdminsWithUsers || 0}</h3>
                    <p className="text-muted mb-0">Admins with Users</p>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <h3 className="text-primary fw-bold">{stats.averageUsersPerAdmin || 0}</h3>
                    <p className="text-muted mb-0">Avg Users/Admin</p>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <h3 className="text-info fw-bold">{stats.userGrowthRate || 0}%</h3>
                    <p className="text-muted mb-0">User Growth Rate</p>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <h3 className="text-danger fw-bold">{stats.inactiveUsers || 0}</h3>
                    <p className="text-muted mb-0">Inactive Users</p>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <h3 className="text-warning fw-bold">{stats.userActivityRate || 0}%</h3>
                    <p className="text-muted mb-0">Activity Rate</p>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => window.location.href = '/superadmin/admin-users'}
                    >
                      <i className="fas fa-link me-2"></i>
                      Manage
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Button variant="outline-primary" className="w-100 h-100 py-4" onClick={() => navigate('/superadmin/admins')}>
                    <div className="text-center">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>➕</div>
                      <strong>Add New Admin</strong>
                      <br />
                      <small className="text-muted">Create new administrator</small>
                    </div>
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button variant="outline-success" className="w-100 h-100 py-4" onClick={() => navigate('/superadmin/plans')}>
                    <div className="text-center">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>📦</div>
                      <strong>Manage Plans</strong>
                      <br />
                      <small className="text-muted">Create and edit plans</small>
                    </div>
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button variant="outline-warning" className="w-100 h-100 py-4" onClick={() => navigate('/superadmin/payment-gateways')}>
                    <div className="text-center">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>💳</div>
                      <strong>Payment Gateways</strong>
                      <br />
                      <small className="text-muted">Configure payment methods</small>
                    </div>
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button variant="outline-info" className="w-100 h-100 py-4" onClick={() => navigate('/superadmin/payments')}>
                    <div className="text-center">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>📊</div>
                      <strong>Generate Reports</strong>
                      <br />
                      <small className="text-muted">View detailed analytics</small>
                    </div>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Status */}
      <Row>
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">System Status</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h6>Database</h6>
                    <Badge bg="success">Online</Badge>
                    <br />
                    <small className="text-muted">Connected</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6>API Server</h6>
                    <Badge bg="success">Online</Badge>
                    <br />
                    <small className="text-muted">Running</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6>Payment Gateway</h6>
                    <Badge bg="success">Online</Badge>
                    <br />
                    <small className="text-muted">Active</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6>Storage</h6>
                    <Badge bg="success">Online</Badge>
                    <br />
                    <small className="text-muted">Available</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SuperAdminDashboard; 