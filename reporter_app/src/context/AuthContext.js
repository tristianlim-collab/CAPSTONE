import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../api';
import pushNotificationService from '../services/push_notification_service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await authAPI.getMe();
          setUser(res.data);
        }
      } catch (error) {
        console.error('Auth init failed', error);
        await AsyncStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const data = res.data;

    if (data && data.token) {
      await AsyncStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    setUser(data.user);

    // Register push notifications and send token to backend
    try {
      const pushToken = await pushNotificationService.registerForPushNotifications();
      if (pushToken) {
        await api.patch('/auth/fcm-token', { fcm_token: pushToken }).catch(err =>
          console.warn('[Auth] FCM token update failed:', err.message)
        );
      }
    } catch (err) {
      console.warn('[Auth] Push registration failed (non-fatal):', err.message);
    }

    return data.user;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const data = res.data;

    if (data && data.token) {
      await AsyncStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    setUser(data.user);

    // Register push notifications and send token to backend
    try {
      const pushToken = await pushNotificationService.registerForPushNotifications();
      if (pushToken) {
        await api.patch('/auth/fcm-token', { fcm_token: pushToken }).catch(err =>
          console.warn('[Auth] FCM token update failed:', err.message)
        );
      }
    } catch (err) {
      console.warn('[Auth] Push registration failed (non-fatal):', err.message);
    }

    return data.user;
  };

  const logout = async () => {
    // Clear push notification token from backend
    try {
      await api.patch('/auth/fcm-token', { fcm_token: null }).catch(() => {});
      pushNotificationService.stopListening();
      await pushNotificationService.clearToken();
    } catch (err) {
      console.warn('[Auth] Push cleanup failed (non-fatal):', err.message);
    }

    await AsyncStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
    } catch (e) {
      console.error('checkAuth failed', e);
    }
  }, []);

  const hasRole = (role) => user?.role === role;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, hasRole, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
