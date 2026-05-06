import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';
import { UserRole } from '../types';

const apiGetMock = vi.fn();
const getMeMock = vi.fn();
const loginMock = vi.fn();
const registerMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
  authAPI: {
    getMe: (...args: unknown[]) => getMeMock(...args),
    login: (...args: unknown[]) => loginMock(...args),
    register: (...args: unknown[]) => registerMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
  },
}));

const baseUser = {
  id: 1,
  email: 'reader@example.com',
  username: 'reader',
  full_name: 'Reader',
  city: 'Moscow',
  about: null,
  role: UserRole.USER,
  is_active: true,
  created_at: '2026-04-23T00:00:00Z',
};

function AuthConsumer() {
  const { user, permissions, loading, login, logout } = useAuth();

  if (loading) {
    return <div>Loading auth</div>;
  }

  return (
    <div>
      <div data-testid="username">{user?.username ?? 'anonymous'}</div>
      <div data-testid="permissions">{permissions.join(',')}</div>
      <button onClick={() => login('reader', 'Password123')} type="button">
        Login
      </button>
      <button onClick={() => logout()} type="button">
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads current user and permissions on startup', async () => {
    getMeMock.mockResolvedValue({ data: baseUser });
    apiGetMock.mockResolvedValue({ data: ['books:create', 'users:view'] });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('reader');
    });
    expect(screen.getByTestId('permissions')).toHaveTextContent('books:create,users:view');
  });

  it('falls back to anonymous state when session init fails', async () => {
    getMeMock.mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('anonymous');
    });
    expect(screen.getByTestId('permissions')).toHaveTextContent('');
  });

  it('updates state on login and clears it on logout', async () => {
    const user = userEvent.setup();

    getMeMock.mockRejectedValueOnce(new Error('401'));
    loginMock.mockResolvedValue({ data: baseUser });
    apiGetMock.mockResolvedValue({ data: ['books:create'] });
    logoutMock.mockResolvedValue({});

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('anonymous');
    });

    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('reader');
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('anonymous');
    });
  });
});
