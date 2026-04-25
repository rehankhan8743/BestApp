import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const useApi = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!endpoint) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE}${endpoint}`, { headers: getHeaders() });
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};

// Hook for manual API calls
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (method, url, data = null) => {
    try {
      setLoading(true);
      setError(null);
      const config = {
        method,
        url: `${API_BASE}${url}`,
        headers: getHeaders()
      };
      if (data && (method === 'post' || method === 'put')) {
        config.data = data;
      }
      const response = await axios(config);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, error };
};
