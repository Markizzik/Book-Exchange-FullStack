import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, Permission } from '../types';
import { hasPermission } from '../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions,
  requireAllPermissions = false,
}) => {
  const { user, loading, hasPermission, isAdmin, isUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    if (requiredRole === UserRole.ADMIN && !isAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredRole === UserRole.USER && !isUser) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAllPermissions) {
      const hasAll = requiredPermissions.every(perm => hasPermission(perm));
      if (!hasAll) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      const hasAny = requiredPermissions.some(perm => hasPermission(perm));
      if (!hasAny) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;