import axios from 'axios';

// Tạo instance của axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Đổi port nếu cần
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor để tự động đính UserId vào header
api.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export const learningService = {
  analyze: (data) => api.post('/learning/analyze', data),
  evaluateWriting: (data) => api.post('/learning/evaluate-writing', data),
};

export const taskService = {
  getDaily: (userId, date) => api.get(`/tasks?userId=${userId}&date=${date}`),
  toggle: (id, userId) => api.patch(`/tasks/${id}/toggle`, { userId }),
};

export default api;