import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Tạo instance của axios
const api = axios.create({
  baseURL: API_URL, // Sử dụng biến môi trường hoặc fallback về localhost
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor để tự động đính Token và UserId vào header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  // Vẫn đính kèm x-user-id để code cũ không bị lỗi ngay lập tức
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
};

export const learningService = {
  evaluateWriting: (data) => api.post('/learning/evaluate-writing', data),
  evaluateDictation: (data) => api.post('/learning/dictation/evaluate', data),
  getTodayReviews: () => api.get('/learning/today-reviews'),
  getDictationReviews: () => api.get('/learning/dictation/reviews'),
  submitDictation: (data) => api.post('/learning/dictation/submit', data),
};

export const taskService = {
  getDaily: (userId, date) => api.get(`/tasks?userId=${userId}&date=${date}`),
  toggle: (id, userId) => api.patch(`/tasks/${id}/toggle`, { userId }),
};

export const activityService = {
  log: (action) => api.post('/activity/log', { action }),
  getStreak: () => api.get('/activity/streak'),
  getHeatmap: () => api.get('/activity/heatmap'),
  getQuests: () => api.get('/activity/quests'),
};

export const dictationApi = {
  getAll: (params) => api.get('/dictations', { params }),
  getById: (id) => api.get(`/dictations/${id}`),
  update: (id, data) => api.put(`/dictations/${id}`, data),
  delete: (id) => api.delete(`/dictations/${id}`),
  create: (data) => api.post('/dictations', data),
  submit: (id, data) => api.post(`/dictations/${id}/submit`, data),
  getAttempts: (dictationId) => api.get(`/dictations/${dictationId}/attempts`),

  // Tạo bài học
  analyzeAudio: (formData) => api.post('/dictations/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyzeYouTube: (data) => api.post('/dictations/analyze-youtube', data),
  save: (data) => api.post('/dictations/save', data)
};

export default api;