import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any old auth data to force login
    localStorage.removeItem('currentUser');
    localStorage.removeItem('businessProfile');
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signup = (email, password, name) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (users.find(u => u.email === email)) {
        throw new Error('User already exists');
      }

      const newUser = {
        id: Date.now().toString(),
        email,
        password, // In production, this should be hashed
        name,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      const userProfile = { id: newUser.id, email: newUser.email, name: newUser.name };
      setUser(userProfile);
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const userProfile = { id: user.id, email: user.email, name: user.name };
      setUser(userProfile);
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};