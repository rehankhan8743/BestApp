import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, { headers: getHeaders() });
      const res = response.data;
      if (res?.success) {
        setUser(res.data);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password }, { headers: getHeaders() });
    const res = response.data;
    if (res?.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user || res.data);
      return res;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const register = async (username, email, password) => {
    const response = await axios.post(`${API_BASE}/auth/register`, { username, email, password }, { headers: getHeaders() });
    const res = response.data;
    if (res?.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user || res.data);
      return res;
    }
    throw new Error(res?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    refreshUser: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
