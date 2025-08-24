import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InvoiceHistory from './InvoiceHistory';
import BusinessProfile from './BusinessProfile';
import BillingPage from './BillingPage';
import './BillingPage.css';

const UserHeader = () => {
  const { user, logout } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showBusinessProfile, setShowBusinessProfile] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth > 768) {
        setShowMobileMenu(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!user) return null;

  const handleMenuClick = (action) => {
    setShowMobileMenu(false);
    action();
  };

  return (
    <>
      <div className="user-header">
        <div className="user-info">
          <h3>👋 Welcome, {user.name}!</h3>
          <p>{user.email}</p>
        </div>
        
        {/* Desktop Navigation */}
        <div className="user-actions desktop-nav">
          <button 
            className="profile-btn"
            onClick={() => setShowBusinessProfile(true)}
          >
            🏢 Business Profile
          </button>
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
        
        {/* Mobile Hamburger Menu */}
        <div className="mobile-nav">
          <button 
            className="hamburger-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${showMobileMenu ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${showMobileMenu ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${showMobileMenu ? 'active' : ''}`}></span>
          </button>
        </div>
      </div>
      
      {/* Mobile menu dropdown - outside of header */}
      {showMobileMenu && (
        <>
          {/* Overlay for mobile menu */}
          <div 
            className="mobile-menu-overlay" 
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu dropdown */}
          <div className="mobile-menu">
            <button 
              className="mobile-menu-item"
              onClick={() => handleMenuClick(() => setShowBusinessProfile(true))}
            >
              <span className="menu-icon">🏢</span>
              Business Profile
            </button>
            <button 
              className="mobile-menu-item"
              onClick={() => handleMenuClick(() => setShowHistory(true))}
            >
              <span className="menu-icon">📊</span>
              History
            </button>
            <button 
              className="mobile-menu-item logout"
              onClick={() => handleMenuClick(logout)}
            >
              <span className="menu-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </>
      )}
      
      {showHistory && (
        <InvoiceHistory onClose={() => setShowHistory(false)} />
      )}
      
      {showBusinessProfile && (
        <BusinessProfile onClose={() => setShowBusinessProfile(false)} />
      )}
    </>
  );
};

export default UserHeader;