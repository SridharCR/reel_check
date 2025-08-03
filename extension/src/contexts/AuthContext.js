import React, { createContext, useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in chrome.storage.local on component mount
    chrome.storage.local.get(['token', 'user'], (result) => {
      if (result.token && result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
      }
      setLoading(false);
    });
  }, []);

  const login = (token, userData) => {
    chrome.storage.local.set({ token, user: userData }, () => {
      setIsAuthenticated(true);
      setUser(userData);
    });
  };

  const logout = () => {
    chrome.storage.local.remove(['token', 'user'], () => {
      setIsAuthenticated(false);
      setUser(null);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};