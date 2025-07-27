import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Navbar, Nav, Container, NavbarBrand, NavLink, Dropdown } from "react-bootstrap";
import useAuth from "../hooks/useAuth";
import { getApi, postApi } from '../utils/api';

const Layout = ({ role, children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Check subscription status for admin
  useEffect(() => {
    if (role === 'admin') {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [role]);

  // Re-check subscription when navigating to dashboard (after payment)
  useEffect(() => {
    if (role === 'admin' && location.pathname === '/admin') {
      checkSubscription();
    }
  }, [location.pathname, role]);

  // Listen for subscription updates from PaymentSuccess
  useEffect(() => {
    const handleSubscriptionUpdate = (event) => {
      if (role === 'admin') {
        setHasSubscription(event.detail.hasSubscription);
      }
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    };
  }, [role]);

  const checkSubscription = async () => {
    try {
      const userData = await getApi("/api/users/profile");
      const isSubscribed = userData.plan && userData.status === 'active';
      setHasSubscription(isSubscribed);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = role === 'superadmin' ? [
    { path: '/superadmin', label: 'Dashboard', icon: '📊' },
    { path: '/superadmin/admins', label: 'Manage Admins', icon: '👨‍💼' },
    { path: '/superadmin/plans', label: 'Manage Plans', icon: '💎' },
    { path: '/superadmin/payment-gateways', label: 'Payment Gateways', icon: '💳' },
    { path: '/superadmin/users', label: 'All Users', icon: '👥' },
    { path: '/superadmin/admin-users', label: 'Admin → Users', icon: '🔗' },
    { path: '/superadmin/payments', label: 'Payments', icon: '💰' },
    { path: '/superadmin/chat', label: 'Chat', icon: '💬' },
    { path: '/superadmin/settings', label: 'CRM Settings', icon: '⚙️' }
  ] : role === 'admin' ? [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'My Users', icon: '👤' },
    { path: '/admin/crm', label: 'CRM Data', icon: '📈' },
    { path: '/admin/chat', label: 'Chat', icon: '💬' },
    ...(hasSubscription ? [] : [{ path: '/admin/plans', label: 'Pricing', icon: '💎' }]),
    { path: '/admin/billing-history', label: 'Billing History', icon: '🧾' },
    { path: '/admin/subscription', label: 'Subscription', icon: '💳' }
  ] : [
    { path: '/user', label: 'Dashboard', icon: '🏠' },
    { path: '/user/chat', label: 'Chat', icon: '💬' }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="bg-dark text-white" style={{ width: '280px', minHeight: '100vh', flexShrink: 0 }}>
        <div className="p-3 border-bottom border-secondary">
          <h5 className="mb-0">
            <span className="text-primary">CRM</span> {role === 'superadmin' ? 'Super Admin' : 'Admin'}
          </h5>
        </div>
        
        <Nav className="flex-column p-3">
          {sidebarItems.map((item, index) => (
            <NavLink
              key={index}
              as={Link}
              to={item.path}
              className={`mb-2 text-white-50 sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
              style={{ 
                textDecoration: 'none',
                padding: '10px 15px',
                borderRadius: '5px',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">
                {item.label}
              </span>
            </NavLink>
          ))}
        </Nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <Navbar bg="white" className="border-bottom shadow-sm">
          <Container fluid>
            <NavbarBrand className="fw-bold text-primary">
              SaaS CRM Platform
            </NavbarBrand>
            <Nav className="ms-auto">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" id="dropdown-basic">
                  Welcome, {role}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/settings">Settings</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Container>
        </Navbar>

        {/* Page Content */}
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            {children}
            <Outlet />
          </Container>
        </div>
      </div>
    </div>
  );
};

export default Layout; 