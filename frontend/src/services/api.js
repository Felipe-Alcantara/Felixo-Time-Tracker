import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  getTree: () => api.get('/categories/tree/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
  getStats: (id) => api.get(`/categories/${id}/stats/`),
};

export const taskAPI = {
  getAll: (categoryId) => api.get('/tasks/', { params: { category_id: categoryId } }),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.put(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
};

export const tagAPI = {
  getAll: () => api.get('/tags/'),
  create: (data) => api.post('/tags/', data),
  update: (id, data) => api.put(`/tags/${id}/`, data),
  delete: (id) => api.delete(`/tags/${id}/`),
};

export const timeEntryAPI = {
  getAll: (params) => api.get('/entries/', { params }),
  create: (data) => api.post('/entries/', data),
  update: (id, data) => api.put(`/entries/${id}/`, data),
  delete: (id) => api.delete(`/entries/${id}/`),
  getRunning: () => api.get('/entries/running/'),
  startTimer: (data) => api.post('/entries/start_timer/', data),
  stopTimer: (data) => api.post('/entries/stop_timer/', data),
  getStats: (params) => api.get('/entries/stats_summary/', { params }),
  getTopTasks: (params) => api.get('/entries/top_tasks/', { params }),
  exportCSV: (params) => api.get('/entries/export_csv/', { 
    params, 
    responseType: 'blob' 
  }),
};

export default api;