import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from './PaymentModal';
import './CreditManager.css';

const CreditManager = () => {
  const { user, updateUserCredits } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [credits, setCredits] = useState(0);
  const [userType, setUserType] = useState('free');

  useEffect(() => {
    if (user) {
      setCredits(user.credits_remaining || 0);
      setUserType(user.user_type || 'free');
    }
  }, [user]);

  const handleBuyCredits = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    const newCredits = credits + (paymentData.credits_added || 0);
    setCredits(newCredits);
    setUserType('credit');
    updateUserCredits(newCredits, 'credit');
    setShowPaymentModal(false);
  };

  const getRemainingInvoices = () => {
    if (userType === 'subscriber') return '∞';
    if (userType === 'free') return Math.max(0, 2 - (user?.invoices_used || 0));
    return credits;
  };

  const getStatusColor = () => {
    if (userType === 'subscriber') return '#4CAF50';
    if (userType === 'free' && (user?.invoices_used || 0) >= 2) return '#f44336';
    if (credits === 0) return '#ff9800';
    return '#2196F3';
  };

  return (
    <div className="credit-manager">
      <div className="credit-display" style={{ borderColor: getStatusColor() }}>
        <div className="credit-info">
          <div className="credit-count">
            <span className="credit-number">{getRemainingInvoices()}</span>
            <span className="credit-label">
              {userType === 'subscriber' ? 'Unlimited' : 'Invoices Left'}
            </span>
          </div>
          <div className="user-type">
            <span className={`user-badge ${userType}`}>
              {userType === 'free' ? 'Free User' : 
               userType === 'credit' ? 'Credit User' : 
               'Premium Subscriber'}
            </span>
          </div>
        </div>
        
        {userType !== 'subscriber' && (
          <div className="credit-actions">
            {(userType === 'free' && (user?.invoices_used || 0) >= 2) || credits === 0 ? (
              <button 
                className="buy-credits-btn urgent"
                onClick={handleBuyCredits}
              >
                Buy Credits to Continue
              </button>
            ) : (
              <button 
                className="buy-credits-btn"
                onClick={handleBuyCredits}
              >
                Add More Credits
              </button>
            )}
            <div className="pricing-info">
              ₹50 for 10 invoices (₹5 each)
            </div>
          </div>
        )}
      </div>

      {userType === 'free' && (user?.invoices_used || 0) < 2 && (
        <div className="free-trial-notice">
          <p>🎉 You have {2 - (user?.invoices_used || 0)} free invoices remaining</p>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          amount={50}
          credits={10}
          type="credits"
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default CreditManager;