/**
 * ProtectedRoute - Route guard for authenticated routes
 * Saves current path before redirecting to login (for post-login navigation)
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LAST_PATH_KEY = 'clawpanel_last_path';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuth } = useAuth();
  const location = useLocation();

  if (!isAuth()) {
    // Save current path before redirecting to login
    localStorage.setItem(LAST_PATH_KEY, location.pathname + location.search);
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
