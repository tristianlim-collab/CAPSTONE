import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
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

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  updatePassword: (data) => api.put('/auth/me/password', data),
  updateFcmToken: (fcm_token) => api.patch('/auth/fcm-token', { fcm_token }),
};

// Barangay endpoints
export const barangayAPI = {
  getAll: () => api.get('/barangays'),
};

// User endpoints
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Incident Type endpoints
export const incidentTypeAPI = {
  getAll: () => api.get('/incident-types'),
  create: (data) => api.post('/incident-types', data),
  update: (id, data) => api.put(`/incident-types/${id}`, data),
  delete: (id) => api.delete(`/incident-types/${id}`),
};

// Incident endpoints
export const incidentAPI = {
  create: (data) => api.post('/incidents', data),
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id, params) => api.get(`/incidents/${id}`, { params }),
  updateStatus: (id, data) => api.patch(`/incidents/${id}/status`, data),
  getAssignedIncidents: () => api.get('/incidents'),
  requestBackup: (id, unit_type) => api.post(`/incidents/${id}/backup`, { unit_type }),
  updatePriority: (id, priority) => api.patch(`/incidents/${id}/priority`, { priority }),
  escalate: (id, data) => api.post(`/incidents/${id}/escalate`, data),
  getHotspots: (params) => api.get('/incidents/analytics/hotspots', { params }),
  verify: (id, data) => api.post(`/incidents/${id}/verify`, data),
  edit: (id, data) => api.patch(`/incidents/${id}/edit`, data),
};

// Assignment endpoints
export const assignmentAPI = {
  assignUnit: (data) => api.post('/assignments', data),
  updateStatus: (id, data) => api.patch(`/assignments/${id}/status`, data)
};

// Response Unit endpoints
export const responseUnitAPI = {
  getAll: () => api.get('/response-units'),
  create: (data) => api.post('/response-units', data),
  update: (id, data) => api.put(`/response-units/${id}`, data),
  updateLocation: (id, data) => api.patch(`/response-units/${id}/location`, data),
  updateStatus: (id, status) => api.patch(`/response-units/${id}/status`, { status }),
  delete: (id) => api.delete(`/response-units/${id}`),
  getHistory: (id, params) => api.get(`/response-units/${id}/history`, { params }),
};

// Post-Incident Report endpoints
export const postReportAPI = {
  submit: (data) => api.post('/post-reports', data),
  getByIncident: (incidentId) => api.get(`/post-reports/${incidentId}`),
  getAll: (params) => api.get('/post-reports', { params }),
  updateStatus: (id, data) => api.patch(`/post-reports/${id}`, data),
};

// Analytics endpoints
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getByType: () => api.get('/analytics/by-type'),
  getTrend: () => api.get('/analytics/trend'),
  getResponseTime: () => api.get('/analytics/response-time'),
  getForecast: (days, model) => api.get(`/analytics/forecast/${days}`, { params: { model } }),
  getModelComparison: () => api.get('/analytics/models/comparison'),
  getPredictionHealth: () => api.get('/analytics/prediction/health'),
  getKDE: () => api.get('/analytics/visualize/kde'),
  train: (data) => api.post('/analytics/train', data),
};

// Report endpoints
export const reportAPI = {
  getHistory: () => api.get('/reports/history'),
  generate: (params) => api.post('/reports/generate', null, { params }),
  export: (format, params) => {
    if (format === 'pdf') {
      return api.get('/reports/export/pdf', { params, responseType: 'blob' });
    }
    return api.get('/reports/export', { params: { ...params, format }, responseType: 'blob' });
  },
  exportPostReports: (params) => {
    return api.get('/reports/export/post-reports', { params, responseType: 'blob' });
  },
  exportPostReportsPDF: (params) => {
    return api.get('/reports/export/post-reports/pdf', { params, responseType: 'blob' });
  }
};

// Upload endpoints
export const uploadAPI = {
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/upload/incident-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Evidence endpoints
export const evidenceAPI = {
  uploadFromUrl: (data) => api.post('/evidence/from-url', data),
  getByIncident: (incidentId) => api.get(`/evidence/${incidentId}`),
};

// Audit Log endpoints
export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
  getActions: () => api.get('/audit/actions'),
};

// System Config endpoints
export const systemConfigAPI = {
  getAll: () => api.get('/config'),
  update: (data) => api.post('/config', data)
};

// Notification endpoints
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  send: (data) => api.post('/notifications/send', data),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

export default api;
