import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import axiosInstance from '../api/index';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Auth init failed", error);
          localStorage.removeItem('token');
          delete axiosInstance.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    
    if (data && data.token) {
      localStorage.setItem('token', data.token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    
    if (data && data.token) {
      localStorage.setItem('token', data.token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
