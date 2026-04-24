import api from '../services/api';

export const useApi = () => {
  const get = async (url) => {
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('API GET error:', error);
      return null;
    }
  };

  const post = async (url, data) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      console.error('API POST error:', error);
      return error.response?.data || null;
    }
  };

  const put = async (url, data) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      console.error('API PUT error:', error);
      return error.response?.data || null;
    }
  };

  const del = async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      console.error('API DELETE error:', error);
      return error.response?.data || null;
    }
  };

  return { get, post, put, del };
};
