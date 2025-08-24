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
        user_type: 'free',
        credits_remaining: 0,
        subscription_status: null,
        subscription_expires_at: null,
        invoices_used: 0,
        total_credits_purchased: 0,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      const userProfile = { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name,
        user_type: newUser.user_type,
        credits_remaining: newUser.credits_remaining,
        subscription_status: newUser.subscription_status,
        invoices_used: newUser.invoices_used,
        total_credits_purchased: newUser.total_credits_purchased
      };
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

      const userProfile = { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        user_type: user.user_type || 'free',
        credits_remaining: user.credits_remaining || 0,
        subscription_status: user.subscription_status,
        invoices_used: user.invoices_used || 0,
        total_credits_purchased: user.total_credits_purchased || 0
      };
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

  const updateUserCredits = (credits, userType) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex].credits_remaining = credits;
      users[userIndex].user_type = userType;
      users[userIndex].total_credits_purchased = (users[userIndex].total_credits_purchased || 0) + (credits - (user.credits_remaining || 0));
      localStorage.setItem('users', JSON.stringify(users));
      
      const updatedUser = { ...user, credits_remaining: credits, user_type: userType };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const deductCredit = () => {
    if (user.user_type === 'subscriber') return true;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) return false;
    
    if (user.user_type === 'free') {
      if (user.invoices_used >= 2) return false;
      users[userIndex].invoices_used = (users[userIndex].invoices_used || 0) + 1;
    } else if (user.user_type === 'credit') {
      if (user.credits_remaining <= 0) return false;
      users[userIndex].credits_remaining = users[userIndex].credits_remaining - 1;
      users[userIndex].invoices_used = (users[userIndex].invoices_used || 0) + 1;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    const updatedUser = { 
      ...user, 
      credits_remaining: users[userIndex].credits_remaining,
      invoices_used: users[userIndex].invoices_used 
    };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    return true;
  };

  const canGenerateInvoice = () => {
    if (user?.user_type === 'subscriber') return true;
    if (user?.user_type === 'free') return (user.invoices_used || 0) < 2;
    if (user?.user_type === 'credit') return (user.credits_remaining || 0) > 0;
    return false;
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    updateUserCredits,
    deductCredit,
    canGenerateInvoice
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};