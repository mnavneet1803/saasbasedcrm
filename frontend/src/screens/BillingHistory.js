import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert, Badge } from "react-bootstrap";

const BillingHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/payments/history", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data);
      } else {
        setError(data.message || "Failed to load billing history");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <h2 className="fw-bold mb-4">Billing History</h2>
      <Table responsive hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Gateway</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && (
            <tr><td colSpan={5} className="text-center text-muted">No transactions found</td></tr>
          )}
          {transactions.map(tx => (
            <tr key={tx._id}>
              <td>{new Date(tx.date).toLocaleString()}</td>
              <td>{tx.plan?.name || "-"}</td>
              <td>₹{tx.amount}</td>
              <td>{tx.gateway}</td>
              <td>
                <Badge bg={tx.status === "success" ? "success" : tx.status === "pending" ? "warning" : "danger"}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default BillingHistory; 