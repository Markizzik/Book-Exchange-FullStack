import { UserRole, Permission } from '../types';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.BOOKS_VIEW,
    Permission.EXCHANGES_VIEW,
    Permission.USERS_VIEW,
  ],
  [UserRole.USER]: [
    Permission.BOOKS_VIEW,
    Permission.BOOKS_CREATE,
    Permission.BOOKS_EDIT,
    Permission.BOOKS_DELETE,
    Permission.EXCHANGES_VIEW,
    Permission.EXCHANGES_CREATE,
    Permission.EXCHANGES_ACCEPT,
    Permission.EXCHANGES_REJECT,
    Permission.EXCHANGES_CANCEL,
    Permission.USERS_VIEW,
    Permission.USERS_EDIT,
  ],
  [UserRole.ADMIN]: [
    Permission.BOOKS_VIEW,
    Permission.BOOKS_CREATE,
    Permission.BOOKS_EDIT,
    Permission.BOOKS_DELETE,
    Permission.BOOKS_EDIT_ANY,
    Permission.BOOKS_DELETE_ANY,
    Permission.EXCHANGES_VIEW,
    Permission.EXCHANGES_CREATE,
    Permission.EXCHANGES_ACCEPT,
    Permission.EXCHANGES_REJECT,
    Permission.EXCHANGES_CANCEL,
    Permission.EXCHANGES_MANAGE_ANY,
    Permission.USERS_VIEW,
    Permission.USERS_EDIT,
    Permission.USERS_EDIT_ANY,
    Permission.USERS_DELETE,
    Permission.USERS_DELETE_ANY,
    Permission.ROLES_VIEW,
    Permission.ROLES_MANAGE,
    Permission.ADMIN_ACCESS,
  ],
};

export const getUserPermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = getUserPermissions(role);
  return permissions.includes(permission);
};

export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

export const isAdmin = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const isUser = (role: UserRole): boolean => {
  return role === UserRole.USER || role === UserRole.ADMIN;
};