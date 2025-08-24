import React from 'react';
import CreditManager from './CreditManager';
import { useAuth } from '../contexts/AuthContext';

const BillingPage = ({ onClose }) => {
  const { user, credits } = useAuth();

  return (
    <div className="billing-page-overlay">
      <div className="billing-page-modal">
        <div className="billing-header">
          <h2>💳 Billing & Credits</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="billing-content">
          <div className="billing-summary">
            <div className="account-info">
              <h3>Account Information</h3>
              <div className="info-row">
                <span>Email:</span>
                <span>{user?.email}</span>
              </div>
              <div className="info-row">
                <span>Account Type:</span>
                <span>Free Plan</span>
              </div>
            </div>

            <div className="credits-overview">
              <h3>Credits Overview</h3>
              <div className="credits-stats">
                <div className="credit-stat">
                  <div className="stat-number">{credits}</div>
                  <div className="stat-label">Remaining Credits</div>
                </div>
                <div className="credit-stat">
                  <div className="stat-number">{credits === 0 ? '0' : '∞'}</div>
                  <div className="stat-label">Invoices Left</div>
                </div>
              </div>
            </div>
          </div>

          <div className="billing-divider"></div>

          <div className="credit-management">
            <h3>Purchase More Credits</h3>
            <p>Each credit allows you to generate one professional invoice PDF.</p>
            <CreditManager />
          </div>

          <div className="billing-divider"></div>

          <div className="billing-help">
            <h3>Need Help?</h3>
            <p>If you have any questions about billing or credits, please contact our support team.</p>
            <button className="support-btn">
              📧 Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;