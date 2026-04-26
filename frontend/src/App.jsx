import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';

import ReporterHome from './pages/reporter/ReporterHome';
import IncidentReportForm from './pages/reporter/IncidentReportForm';
import ReportSuccess from './pages/reporter/ReportSuccess';
import ReporterProfile from './pages/reporter/ReporterProfile';
import MyReports from './pages/reporter/MyReports';

import ShiftStart from './pages/response/ShiftStart';
import ResponseDashboard from './pages/response/ResponseDashboard';
import ResponseMap from './pages/response/ResponseMap';
import ResponseNotifications from './pages/response/ResponseNotifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RolesPermissions from './pages/admin/RolesPermissions';
import IncidentManagement from './pages/admin/IncidentManagement';
import Analytics from './pages/admin/Analytics';
import NotificationSettings from './pages/admin/NotificationSettings';
import SystemSettings from './pages/admin/SystemSettings';
import IncidentVerificationQueue from './pages/admin/IncidentVerificationQueue';

// Administration Layouts
import AdminLayout from './components/layout/AdminLayout';
import ResponseLayout from './components/layout/ResponseLayout';

const EmptyResponsePage = ({ title }) => (
  <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-6xl mx-auto w-full">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
      <p className="text-slate-500 mt-2">This module is part of the next development phase.</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="verification" element={<IncidentVerificationQueue />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="roles" element={<RolesPermissions />} />
              <Route path="categories" element={<IncidentManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications" element={<NotificationSettings />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>

            {/* Response Unit Routes */}
            <Route path="/response/shift-start" element={<ProtectedRoute role="RESPONSE_UNIT"><ShiftStart /></ProtectedRoute>} />
            
            <Route path="/response" element={<ProtectedRoute role="RESPONSE_UNIT"><ResponseLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/response/dashboard" replace />} />
              <Route path="dashboard" element={<ResponseDashboard />} />
              <Route path="map" element={<ResponseMap />} />
              <Route path="notifications" element={<ResponseNotifications />} />
            </Route>

            {/* Reporter Routes */}
            <Route path="/reporter/home" element={<ProtectedRoute role="REPORTER"><ReporterHome /></ProtectedRoute>} />
            <Route path="/reporter/report" element={<ProtectedRoute role="REPORTER"><IncidentReportForm /></ProtectedRoute>} />
            <Route path="/reporter/report/success" element={<ProtectedRoute role="REPORTER"><ReportSuccess /></ProtectedRoute>} />
            <Route path="/reporter/profile" element={<ProtectedRoute role="REPORTER"><ReporterProfile /></ProtectedRoute>} />
            <Route path="/reporter/reports" element={<ProtectedRoute role="REPORTER"><MyReports /></ProtectedRoute>} />
            <Route path="/reporter/*" element={<ProtectedRoute role="REPORTER"><ReporterHome /></ProtectedRoute>} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
