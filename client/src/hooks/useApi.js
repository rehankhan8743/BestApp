import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const get = useCallback(async (url, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}${url}`, {
        headers: getHeaders(),
        params
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (url, data = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE}${url}`, data, {
        headers: getHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const put = useCallback(async (url, data = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`${API_BASE}${url}`, data, {
        headers: getHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const del = useCallback(async (url) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.delete(`${API_BASE}${url}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    get,
    post,
    put,
    del,
    loading,
    error
  };
};
