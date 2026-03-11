import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, Permission } from '../types';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';

interface CanProps {
  children: React.ReactNode;
  role?: UserRole;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

const Can: React.FC<CanProps> = ({
  children,
  role,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  if (role && user.role !== role && user.role !== UserRole.ADMIN) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const checkResult = requireAll
      ? hasAllPermissions(user.role, permissions)
      : hasAnyPermission(user.role, permissions);
    
    if (!checkResult) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default Can;