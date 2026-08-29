import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
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
import ResponseIncidents from './pages/response/ResponseIncidents';
import ResponseNotifications from './pages/response/ResponseNotifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ResponseUnitManagement from './pages/admin/ResponseUnitManagement';
import IncidentManagement from './pages/admin/IncidentManagement';
import Analytics from './pages/admin/Analytics';
import SystemSettings from './pages/admin/SystemSettings';
import IncidentVerificationQueue from './pages/admin/IncidentVerificationQueue';
import PostIncidentReports from './pages/admin/PostIncidentReports';
import IncidentArchive from './pages/admin/IncidentArchive';
import AuditLogs from './pages/admin/AuditLogs';
import UserGuide from './pages/common/UserGuide';

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
  React.useEffect(() => {
    // Silent warm-up ping to wake up free Render backend on app load
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    fetch(`${baseUrl}/health`).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
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
                <Route path="response-units" element={<ResponseUnitManagement />} />
                <Route path="categories" element={<IncidentManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="post-incident-reports" element={<PostIncidentReports />} />
                <Route path="archive" element={<IncidentArchive />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="guide" element={<UserGuide />} />
              </Route>

              {/* Response Unit Routes */}
              <Route path="/response/shift-start" element={<ProtectedRoute role="RESPONSE_UNIT"><ShiftStart /></ProtectedRoute>} />

              <Route path="/response" element={<ProtectedRoute role="RESPONSE_UNIT"><ResponseLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/response/map" replace />} />
                <Route path="dashboard" element={<ResponseDashboard />} />
                <Route path="map" element={<ResponseMap />} />
                <Route path="incidents" element={<ResponseIncidents />} />
                <Route path="notifications" element={<ResponseNotifications />} />
                <Route path="guide" element={<UserGuide />} />
              </Route>

              {/* Public Reporter Routes (No Login Required for Emergency) */}
              <Route path="/reporter/home" element={<ReporterHome />} />
              <Route path="/reporter/report" element={<IncidentReportForm />} />
              <Route path="/reporter/report/success" element={<ReportSuccess />} />
              
              {/* Optional Reporter Auth Routes */}
              <Route path="/reporter/profile" element={<ProtectedRoute role="REPORTER"><ReporterProfile /></ProtectedRoute>} />
              <Route path="/reporter/reports" element={<ProtectedRoute role="REPORTER"><MyReports /></ProtectedRoute>} />
              <Route path="/reporter/*" element={<ReporterHome />} />

              {/* Default */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 10000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
