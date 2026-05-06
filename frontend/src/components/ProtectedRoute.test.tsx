import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { Permission, UserRole } from '../types';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderWithRoutes(element: React.ReactNode) {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={element} />
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('redirects anonymous users to login', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      permissions: [],
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      hasPermission: vi.fn(),
      isAdmin: false,
      isUser: false,
      refreshUser: vi.fn(),
    });

    renderWithRoutes(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects user without required role to unauthorized page', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, role: UserRole.USER } as never,
      permissions: [],
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      hasPermission: vi.fn().mockReturnValue(false),
      isAdmin: false,
      isUser: true,
      refreshUser: vi.fn(),
    });

    renderWithRoutes(
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <div>Admin content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Unauthorized page')).toBeInTheDocument();
  });

  it('renders children when permission check passes', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, role: UserRole.ADMIN } as never,
      permissions: [Permission.ROLES_MANAGE],
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      hasPermission: vi.fn().mockReturnValue(true),
      isAdmin: true,
      isUser: true,
      refreshUser: vi.fn(),
    });

    renderWithRoutes(
      <ProtectedRoute requiredPermissions={[Permission.ROLES_MANAGE]}>
        <div>Admin content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
