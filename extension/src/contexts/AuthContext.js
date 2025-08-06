import React, { createContext, useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthContext: Starting authentication check...");
      try {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['token', 'user'], resolve);
        });

        console.log("AuthContext: chrome.storage.local.get result:", result);

        if (result.token && result.user && result.user.email) {
          console.log("AuthContext: Token and user found. Setting isAuthenticated to true.");
          setIsAuthenticated(true);
          setUser(result.user);
        } else {
          console.log("AuthContext: Token or user not found. Setting isAuthenticated to false.");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error checking local storage for auth:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log("AuthContext: Setting loading to false.");
        setLoading(false);
      }
    };

    checkAuth();
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

  const handleAuthError = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, handleAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};