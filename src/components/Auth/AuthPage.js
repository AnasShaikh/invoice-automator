import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>📄 Invoice Generator</h1>
          <p>Professional invoices for your business</p>
        </div>
        
        {isLogin ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <SignupForm onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;