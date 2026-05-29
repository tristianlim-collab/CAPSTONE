import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../api';
import pushNotificationService from '../services/push_notification_service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    user_id: 'guest-id',
    name: 'Citizen',
    email: 'guest@gaoirs.com',
    role: 'REPORTER'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Silent background check if token exists, but don't block
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await authAPI.getMe().catch(() => null);
          if (res?.data) setUser(res.data);
        }
      } catch (error) {
        console.warn('Auth init silent failed');
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
  const isAuthenticated = true; // Always true to bypass login

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, hasRole, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
