import axios from 'axios';

// In production, use relative URL (same origin)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (formData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.put('/auth/password', data)
};

// User APIs
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (username) => api.get(`/users/${username}`),
  getUserThreads: (username, params) => api.get(`/users/${username}/threads`, { params }),
  banUser: (id, reason) => api.post(`/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.post(`/users/${id}/unban`),
  changeRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

// Category APIs
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (slug, params) => api.get(`/categories/${slug}`, { params }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

// Thread APIs
export const threadAPI = {
  getThreads: (params) => api.get('/threads', { params }),
  getTrending: () => api.get('/threads/trending'),
  getLatest: () => api.get('/threads/latest'),
  getThread: (slug, params) => api.get(`/threads/${slug}`, { params }),
  createThread: (data) => api.post('/threads', data),
  updateThread: (id, data) => api.put(`/threads/${id}`, data),
  deleteThread: (id) => api.delete(`/threads/${id}`),
  likeThread: (id) => api.post(`/threads/${id}/like`),
  pinThread: (id) => api.post(`/threads/${id}/pin`),
  lockThread: (id) => api.post(`/threads/${id}/lock`)
};

// Post APIs
export const postAPI = {
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  thankPost: (id) => api.post(`/posts/${id}/thanks`),
  reportPost: (id, data) => api.post(`/posts/${id}/report`, data)
};

// Search APIs
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } })
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// Message APIs
export const messageAPI = {
  getConversations: () => api.get('/messages'),
  getConversation: (id) => api.get(`/messages/${id}`),
  createConversation: (data) => api.post('/messages', data),
  reply: (id, content) => api.post(`/messages/${id}/reply`, { content }),
  deleteConversation: (id) => api.delete(`/messages/${id}`)
};

// Upload APIs
export const uploadAPI = {
  uploadFile: (formData) => api.post('/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadScreenshot: (formData) => api.post('/uploads/screenshot', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Report APIs
export const reportAPI = {
  getReports: (params) => api.get('/reports', { params }),
  createReport: (data) => api.post('/reports', data),
  resolveReport: (id, action) => api.put(`/reports/${id}/resolve`, { actionTaken: action }),
  dismissReport: (id) => api.put(`/reports/${id}/dismiss`)
};

// Stats APIs
export const statsAPI = {
  getStats: () => api.get('/stats')
};

export default api;
