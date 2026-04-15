import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getRoleDefaultPath = (role) => {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }
  if (role === "RESPONSE_UNIT") {
    return "/response/shift-start";
  }
  return "/reporter/home";
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">Loading...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleDefaultPath(user?.role)} replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">Loading...</div>
    );
  }

  return !isAuthenticated ? children : <Navigate to={getRoleDefaultPath(user?.role)} replace />;
};
