import React, { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';

const AuthWrapper = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    setUser(pb.authStore.model);
    setLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((auth) => {
      setUser(auth);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await pb.collection('users').authWithPassword(email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Create user account
      const userData = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      
      await pb.collection('users').create(userData);
      
      // Auto-login after signup
      await pb.collection('users').authWithPassword(email, password);
      
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>{showLogin ? 'Sign In' : 'Create Account'}</h2>
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={showLogin ? handleLogin : handleSignup}>
            {!showLogin && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="auth-btn">
              {showLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <p className="auth-toggle">
            {showLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => setShowLogin(!showLogin)}
              className="link-btn"
            >
              {showLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="user-bar">
        <span>Welcome, {user.name || user.email}!</span>
        <button onClick={handleLogout} className="logout-btn">
          Sign Out
        </button>
      </div>
      {children}
    </div>
  );
};

export default AuthWrapper;