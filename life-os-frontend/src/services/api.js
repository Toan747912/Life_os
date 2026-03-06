import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Tạo instance của axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tự động đính Token và UserId vào header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor: tự động logout nếu token hết hạn (401)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Xóa session và redirect về login
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      // Dùng window.location để thoát khỏi React router context
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
};

export const userApi = {
  getPreferences: () => api.get('/user/preferences'),
  updatePreferences: (preferences) => api.patch('/user/preferences', preferences)
};

export const learningService = {
  evaluateWriting: (data) => api.post('/learning/evaluate-writing', data),
  evaluateDictation: (data) => api.post('/learning/dictation/evaluate', data),
  getTodayReviews: () => api.get('/learning/today-reviews'),
  getDictationReviews: () => api.get('/learning/dictation/reviews'),
  submitDictation: (data) => api.post('/learning/dictation/submit', data),
  quickAdd: (data) => api.post('/learning/quick-add', data),
  lookup: (data) => api.post('/learning/lookup', data),
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
  analyzeAudio: (formData, onUploadProgress) => api.post('/dictations/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onUploadProgress
  }),
  analyzeYouTube: (data) => api.post('/dictations/analyze-youtube', data),
  save: (data) => api.post('/dictations/save', data)
};

export const vocabularyApi = {
  add: (data) => api.post('/vocabularies', data),
  getAll: () => api.get('/vocabularies'),
  delete: (id) => api.delete(`/vocabularies/${id}`)
};

export const flashcardApi = {
  getDue: () => api.get('/flashcards/due'),
  review: (id, quality) => api.post(`/flashcards/review/${id}`, { quality })
};

export const financeApi = {
  getSummary: (params) => api.get('/finance/summary', { params }),
  getTransactions: (params) => api.get('/finance/transactions', { params }),
  createTransaction: (data) => api.post('/finance/transactions', data),
  updateTransaction: (id, data) => api.put(`/finance/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`),
  getCategories: () => api.get('/finance/categories'),
  createCategory: (data) => api.post('/finance/categories', data),
  deleteCategory: (id) => api.delete(`/finance/categories/${id}`),
  upsertBudget: (data) => api.post('/finance/budgets', data),
};

export const deckApi = {
  getAll: () => api.get('/decks'),
  getById: (id) => api.get(`/decks/${id}`),
  create: (data) => api.post('/decks', data),
  update: (id, data) => api.put(`/decks/${id}`, data),
  delete: (id) => api.delete(`/decks/${id}`),
  addItems: (id, itemIds) => api.post(`/decks/${id}/items`, { itemIds }),
  removeItems: (id, itemIds) => api.delete(`/decks/${id}/items`, { data: { itemIds } })
};

export const gamificationApi = {
  getDashboard: () => api.get('/gamification/dashboard'),
  addXp: (amount) => api.post('/gamification/xp', { amount }),
  updateQuest: (questType, progressAmount) => api.post('/gamification/quests/progress', { questType, progressAmount }),
  createGoal: (data) => api.post('/gamification/goals', data),
  updateGoalProgress: (goalId, progressAmount) => api.put(`/gamification/goals/${goalId}/progress`, { progressAmount })
};

export const aiFeatureApi = {
  generateStory: (words, difficulty) => api.post('/ai/story', { words, difficulty }),
  generateCloze: (sentences) => api.post('/ai/cloze', { sentences }),
  generateInsight: () => api.post('/insights/generate')
};

export const conversationApi = {
  getAll: () => api.get('/conversations'),
  start: (topic) => api.post('/conversations', { topic }),
  sendMessage: (id, message) => api.post(`/conversations/${id}/messages`, { message }),
  evaluate: (id) => api.post(`/conversations/${id}/evaluate`)
};

export default api;