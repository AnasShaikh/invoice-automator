import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InvoiceHistory from './InvoiceHistory';

const UserHeader = () => {
  const { user, logout } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="user-header">
        <div className="user-info">
          <h3>👋 Welcome, {user.name}!</h3>
          <p>{user.email}</p>
        </div>
        <div className="user-actions">
          <button 
            className="history-btn"
            onClick={() => setShowHistory(true)}
          >
            📊 History
          </button>
          <button 
            className="logout-btn"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {showHistory && (
        <InvoiceHistory onClose={() => setShowHistory(false)} />
      )}
    </>
  );
};

export default UserHeader;