import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getStoredToken, setStoredToken, removeStoredToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize and verify session on initial load
  const initAuth = useCallback(async () => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe(savedToken);
      if (res.success && res.user) {
        setUser(res.user);
        setToken(savedToken);
      } else {
        // Token invalid or expired
        removeStoredToken();
        setUser(null);
        setToken(null);
      }
    } catch {
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email, password) => {
    setAuthError(null);
    const res = await api.login(email, password);

    if (res.success && res.token && res.user) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    } else {
      const errMsg = res.message || 'Login failed. Please check your credentials.';
      setAuthError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const logout = async () => {
    await api.logout();
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    refreshUser: initAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
