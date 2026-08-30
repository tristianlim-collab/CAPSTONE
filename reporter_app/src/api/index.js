import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically detect the local IP address from the Expo Metro bundler
const getBackendIp = () => {
  // 1. Try hostUri (Classic Expo)
  if (Constants.expoConfig?.hostUri) {
    return Constants.expoConfig.hostUri.split(':')[0];
  }
  
  // 2. Try experienceUrl (e.g. "exp://192.168.x.x:8081")
  if (Constants.experienceUrl) {
    const match = Constants.experienceUrl.match(/:\/\/([a-zA-Z0-9.-]+)(?::\d+)?/);
    if (match && match[1] && match[1] !== '127.0.0.1' && match[1] !== 'localhost') {
      return match[1];
    }
  }

  // 3. Try debuggerHost (Modern Expo Go)
  const debuggerHost = Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  // 4. Fallback (Current machine IP: 192.168.245.129)
  // For Android Emulator, you can also try '10.0.2.2' if this fails
  return '192.168.245.129';
};

const backendIp = getBackendIp();

// In production (standalone APK build), use live Render backend. In local dev, auto-detect IP.
const isDev = __DEV__;
const PROD_URL = 'https://gaoirs-backend.onrender.com';

// Connect directly to live Render backend so mobile app and Vercel admin panel share real-time socket events
const API_URL = `${PROD_URL}/api`;
export const SOCKET_URL = PROD_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s timeout to allow Render free server cold-start and photo uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
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
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  updatePassword: (data) => api.put('/auth/me/password', data),
};

// Incident endpoints
export const incidentAPI = {
  create: (data) => api.post('/incidents', data),
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id, params) => api.get(`/incidents/${id}`, { params }),
  updateStatus: (id, data) => api.patch(`/incidents/${id}/status`, data),
};

// Incident Type endpoints
export const incidentTypeAPI = {
  getAll: () => api.get('/incident-types'),
};

export default api;
