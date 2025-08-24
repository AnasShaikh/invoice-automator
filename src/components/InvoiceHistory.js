import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const InvoiceHistory = ({ onClose }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (user) {
      const userInvoices = JSON.parse(localStorage.getItem(`invoices_${user.id}`) || '[]');
      setInvoices(userInvoices);
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 Invoice History</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="invoice-history">
          {invoices.length === 0 ? (
            <div className="empty-state">
              <p>📄 No invoices generated yet</p>
              <p>Create your first invoice to see it here!</p>
            </div>
          ) : (
            <div className="invoice-list">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="invoice-item">
                  <div className="invoice-main">
                    <div className="client-name">{invoice.client.name || 'Unnamed Client'}</div>
                    <div className="invoice-total">{formatCurrency(invoice.totals.total)}</div>
                  </div>
                  <div className="invoice-details">
                    <span className="invoice-date">
                      Generated: {formatDate(invoice.createdAt)}
                    </span>
                    <span className="items-count">
                      {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistory;