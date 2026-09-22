import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';

// Lazy loading heavy pages for faster initial load
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Unauthorized = lazy(() => import('./pages/auth/Unauthorized'));

const ReporterHome = lazy(() => import('./pages/reporter/ReporterHome'));
const IncidentReportForm = lazy(() => import('./pages/reporter/IncidentReportForm'));
const ReportSuccess = lazy(() => import('./pages/reporter/ReportSuccess'));
const ReporterProfile = lazy(() => import('./pages/reporter/ReporterProfile'));
const MyReports = lazy(() => import('./pages/reporter/MyReports'));

const ShiftStart = lazy(() => import('./pages/response/ShiftStart'));
const ResponseDashboard = lazy(() => import('./pages/response/ResponseDashboard'));
const ResponseMap = lazy(() => import('./pages/response/ResponseMap'));
const ResponseIncidents = lazy(() => import('./pages/response/ResponseIncidents'));
const ResponseNotifications = lazy(() => import('./pages/response/ResponseNotifications'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ResponseUnitManagement = lazy(() => import('./pages/admin/ResponseUnitManagement'));
const IncidentManagement = lazy(() => import('./pages/admin/IncidentManagement'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const IncidentVerificationQueue = lazy(() => import('./pages/admin/IncidentVerificationQueue'));
const PostIncidentReports = lazy(() => import('./pages/admin/PostIncidentReports'));
const IncidentArchive = lazy(() => import('./pages/admin/IncidentArchive'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const UserGuide = lazy(() => import('./pages/common/UserGuide'));

// Administration Layouts
import AdminLayout from './components/layout/AdminLayout';
import ResponseLayout from './components/layout/ResponseLayout';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
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
            <Suspense fallback={<LoadingFallback />}>
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

                {/* Reporter Routes */}
                <Route path="/reporter/home" element={<ReporterHome />} />
                <Route path="/reporter/report" element={<IncidentReportForm />} />
                <Route path="/reporter/report/success" element={<ReportSuccess />} />
                <Route path="/reporter/reports" element={<MyReports />} />
                <Route path="/reporter/profile" element={<Navigate to="/reporter/home" replace />} />
                <Route path="/reporter/*" element={<ReporterHome />} />

                {/* Default */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
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
