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

  // 4. Fallback (Current Wi-Fi Machine IP: 192.168.241.129)
  return '192.168.241.129';
};

const backendIp = getBackendIp();
const isDev = __DEV__;
const PROD_URL = 'https://gaoirs-backend.onrender.com';

// In Expo Go dev mode (__DEV__), route directly to your PC's local backend (http://192.168.241.129:3001) over Wi-Fi
// In standalone APK build, route to live Render URL
const API_URL = isDev ? `http://${backendIp}:3001/api` : `${PROD_URL}/api`;
export const SOCKET_URL = isDev ? `http://${backendIp}:3001` : PROD_URL;

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
