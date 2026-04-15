import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ role, children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><LoadingSpinner size="lg" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><LoadingSpinner size="lg" /></div>;
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'RESPONSE_UNIT') return <Navigate to="/response/shift-start" replace />;
    if (user.role === 'REPORTER') return <Navigate to="/reporter/home" replace />;
  }

  return children || <Outlet />;
};
