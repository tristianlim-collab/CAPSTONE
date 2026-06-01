import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../api';
import pushNotificationService from '../services/push_notification_service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Default reporter credentials (created by seed.js)
const DEFAULT_REPORTER_EMAIL = 'reporter@gaoirs.com';
const DEFAULT_REPORTER_PASSWORD = 'Reporter@2026';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    user_id: 'guest-id',
    name: 'Citizen',
    email: 'guest@gaoirs.com',
    role: 'REPORTER'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Token exists — verify it's still valid
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await authAPI.getMe().catch(() => null);
          if (res?.data) {
            setUser(res.data);
            return; // Done — token is valid
          }
        }

        // No token or expired — auto-login as default reporter
        console.log('[Auth] No valid token, auto-logging in as default reporter...');
        const loginRes = await authAPI.login(DEFAULT_REPORTER_EMAIL, DEFAULT_REPORTER_PASSWORD);
        const data = loginRes.data;
        if (data?.token) {
          await AsyncStorage.setItem('token', data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          setUser(data.user);
          console.log('[Auth] Auto-login successful:', data.user?.name);
        }
      } catch (error) {
        console.warn('[Auth] Auto-login failed:', error.message);
        // Keep guest user as fallback
      }
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
    return data.user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    // Keep user as guest instead of null to avoid redirecting back to login
    setUser({
      user_id: 'guest-id',
      name: 'Citizen',
      email: 'guest@gaoirs.com',
      role: 'REPORTER'
    });
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
  const isAuthenticated = true; // Always true to bypass login screen

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, hasRole, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
