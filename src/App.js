import React from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import SimpleInvoiceForm from './components/SimpleInvoiceForm';
import CreditManager from './components/CreditManager';
import UserHeader from './components/UserHeader';
import './utils/suppressMetaMask'; // Suppress MetaMask warnings
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="App">
      <div className="simple-container">
        <UserHeader />
        <h1>Invoice Generator</h1>
        <CreditManager />
        <SimpleInvoiceForm />
      </div>
    </div>
  );
}

export default App;