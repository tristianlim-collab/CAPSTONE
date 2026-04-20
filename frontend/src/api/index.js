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
};

// Barangay endpoints
export const barangayAPI = {
  getAll: () => api.get('/barangays'),
};

// User endpoints
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
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
  getById: (id) => api.get(`/incidents/${id}`),
  updateStatus: (id, data) => api.patch(`/incidents/${id}/status`, data),
  getAssignedIncidents: () => api.get('/incidents'),
  requestBackup: (id, unit_type) => api.post(`/incidents/${id}/backup`, { unit_type }),
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
};

// Post-Incident Report endpoints
export const postReportAPI = {
  submit: (data) => api.post('/post-reports', data),
  getByIncident: (incidentId) => api.get(`/post-reports/${incidentId}`),
};

// Analytics endpoints
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getByType: () => api.get('/analytics/by-type'),
  getTrend: () => api.get('/analytics/trend'),
  getResponseTime: () => api.get('/analytics/response-time'),
};

// Report endpoints
export const reportAPI = {
  getHistory: () => api.get('/reports/history'),
  generate: (params) => api.post('/reports/generate', null, { params })
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

export default api;
