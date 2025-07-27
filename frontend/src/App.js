import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import SuperAdminDashboard from "./screens/SuperAdminDashboard";
import SuperAdminUsers from "./screens/SuperAdminUsers";
import SuperAdminAdminUsers from "./screens/SuperAdminAdminUsers";
import AdminDashboard from "./screens/AdminDashboard";
import AdminUsers from "./screens/AdminUsers";
import NotFound from "./screens/NotFound";
import Layout from "./components/Layout";
import useAuth from "./hooks/useAuth";
import ManageAdmins from "./screens/ManageAdmins";
import ManagePlans from "./screens/ManagePlans";
import Payments from "./screens/Payments";
import CRMSettings from "./screens/CRMSettings";
import CRMData from "./screens/CRMData";
import Subscription from "./screens/Subscription";
import Logout from "./screens/Logout";
import PlanSelection from "./screens/PlanSelection";
import PricingPage from "./screens/PricingPage";
import PaymentSuccess from "./screens/PaymentSuccess";
import BillingHistory from "./screens/BillingHistory";
import ManagePaymentGateways from "./screens/ManagePaymentGateways";
import Chat from "./screens/Chat";
import UserDashboard from "./screens/UserDashboard";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <h2>Unauthorized</h2>;
  }
  
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'user') return <Navigate to="/user" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Remove public signup route. Only superadmin can create admins. */}
        <Route path="/logout" element={<Logout />} />
        <Route path="/superadmin/*" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Layout role='superadmin' />
          </ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="admins" element={<ManageAdmins />} />
          <Route path="plans" element={<ManagePlans />} />
          <Route path="payment-gateways" element={<ManagePaymentGateways />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="admin-users" element={<SuperAdminAdminUsers />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<CRMSettings />} />
          <Route path="chat" element={<Chat />} />
        </Route>
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout role='admin' />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="plans" element={<PricingPage />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="billing-history" element={<BillingHistory />} />
          <Route path="crm" element={<CRMData />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="chat" element={<Chat />} />
        </Route>
        <Route path="/user/*" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Layout role='user' />
          </ProtectedRoute>
        }>
          <Route index element={<UserDashboard />} />
          <Route path="chat" element={<Chat />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
