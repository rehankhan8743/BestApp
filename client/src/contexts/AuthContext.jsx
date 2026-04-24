import { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { get, post } = useApi();

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
      const res = await get('/auth/me');
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
    const res = await post('/auth/login', { email, password });
    if (res?.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res;
    }
    return res;
  };

  const register = async (userData) => {
    const res = await post('/auth/register', userData);
    if (res?.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res;
    }
    return res;
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
