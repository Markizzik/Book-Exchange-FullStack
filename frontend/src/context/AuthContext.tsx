import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, AuthResponse, UserRole } from '../types';
import { authAPI } from '../services/api';
import api from '../services/api';
import { getUserPermissions, hasPermission } from '../utils/permissions';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        loadUserPermissions(token);
      }
    }
    setLoading(false);
  }, []);

  const loadUserPermissions = async (token: string) => {
    try {
      const response = await api.get<string[]>('/auth/me/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки разрешений:', error);
      if (user) {
        setPermissions(getUserPermissions(user.role));
      }
    }
  };

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    setUser(userData);
    await loadUserPermissions(access_token);
  };

  const register = async (registerData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => {
    const response = await authAPI.register(registerData);
    const { access_token, user: userFromResponse } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userFromResponse));
    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    setUser(userFromResponse);
    await loadUserPermissions(access_token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions([]);
  };

   const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return permissions.includes(permission) || 
           getUserPermissions(user.role).includes(permission as any);
  };

  const value = {
    user,
    permissions,
    login,
    register,
    logout,
    loading,
    hasPermission: checkPermission,
    isAdmin: user?.role === UserRole.ADMIN,
    isUser: user?.role === UserRole.USER || user?.role === UserRole.ADMIN,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};