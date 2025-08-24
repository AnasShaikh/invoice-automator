import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PaymentModal.css';

const PaymentModal = ({ amount, credits, type, onSuccess, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Create order on backend
      const orderResponse = await fetch('http://localhost:3001/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: 'INR',
          type,
          credits
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_R8IifHJLQxEjpQ',
        amount: amount * 100,
        currency: 'INR',
        name: 'Invoice Generator',
        description: type === 'credits' ? `${credits} Invoice Credits` : 'Premium Subscription',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('http://localhost:3001/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Payment verified successfully
              onSuccess({
                payment_id: verifyData.payment_id,
                order_id: verifyData.order_id,
                signature: response.razorpay_signature,
                credits_added: verifyData.credits_added,
                amount: verifyData.amount,
                verified: true
              });
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#2196F3'
        },
        method: {
          card: true,
          netbanking: true,
          upi: true,
          wallet: false,
          paylater: false
        },
        config: {
          display: {
            blocks: {
              utib: { // Axis Bank
                name: 'Pay using Axis Bank',
                instruments: [
                  {
                    method: 'card'
                  },
                  {
                    method: 'netbanking'
                  }
                ]
              },
              other: {
                name: 'Test Payment Methods',
                instruments: [
                  {
                    method: 'card'
                  },
                  {
                    method: 'upi'
                  }
                ]
              }
            },
            hide: [
              {
                method: 'wallet'
              }
            ],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-header">
          <h2>Purchase Credits</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-content">
          <div className="purchase-summary">
            <div className="summary-item">
              <span>Credits:</span>
              <span>{credits} invoices</span>
            </div>
            <div className="summary-item">
              <span>Price:</span>
              <span>₹{amount}</span>
            </div>
            <div className="summary-item">
              <span>Per invoice:</span>
              <span>₹{amount / credits}</span>
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="payment-actions">
            <button 
              className="cancel-btn" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="pay-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₹${amount}`}
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="test-payment-section">
              <p className="test-note">🧪 Test Mode - Use these methods:</p>
              <div className="test-methods">
                <div className="test-method">
                  <strong>Test Card:</strong> 4111 1111 1111 1111
                  <br />
                  <small>Expiry: 12/25, CVV: 123</small>
                </div>
                <div className="test-method">
                  <strong>Test UPI:</strong> success@razorpay
                </div>
                <button 
                  className="mock-success-btn"
                  onClick={() => {
                    onSuccess({
                      payment_id: 'test_pay_' + Date.now(),
                      order_id: 'test_order_' + Date.now(),
                      signature: 'test_signature',
                      credits_added: credits,
                      amount: amount,
                      verified: true,
                      mock: true
                    });
                  }}
                  disabled={loading}
                >
                  ✅ Mock Successful Payment (Dev Only)
                </button>
              </div>
            </div>
          )}

          <div className="payment-security">
            <div className="security-badges">
              <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" />
              <span>Secured by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;