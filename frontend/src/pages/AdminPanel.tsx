import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import api from '../services/api';
import Can from '../components/Can';
import { Permission } from '../types';

const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'books' | 'roles'>('users');

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      navigate('/unauthorized');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      const response = await api.get<User[]>('/auth/admin/users');
      setUsers(response.data);
    } catch (err: any) {
      setError('Не удалось загрузить пользователей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: UserRole) => {
    if (userId === user?.id) {
      alert('Нельзя изменить свою собственную роль');
      return;
    }

    if (!window.confirm(`Изменить роль пользователя на ${newRole}?`)) {
      return;
    }

    try {
      await api.post(`/auth/admin/users/${userId}/role`, { new_role: newRole });
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка обновления роли');
    }
  };

  const toggleUserActive = async (userId: number, isActive: boolean) => {
    if (userId === user?.id) {
      alert('Нельзя деактивировать самого себя');
      return;
    }

    try {
      await api.put(`/auth/admin/users/${userId}`, { is_active: !isActive });
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка обновления статуса');
    }
  };

  const deleteUser = async (userId: number) => {
    if (userId === user?.id) {
      alert('Нельзя удалить самого себя');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await api.delete(`/auth/admin/users/${userId}`);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка удаления пользователя');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { bg: '#dc2626', color: 'white' };
      case UserRole.USER:
        return { bg: '#4f46e5', color: 'white' };
      default:
        return { bg: '#6b7280', color: 'white' };
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Админ-панель</h1>
        <p>Управление пользователями и ролями</p>
      </div>

      <div className="card mb-3">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>

          <Can permissions={[Permission.BOOKS_EDIT_ANY]}>
            <button
              className={`btn ${activeTab === 'books' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('books')}
            >
              Управление книгами
            </button>
          </Can>
          
          <Can permissions={[Permission.ROLES_MANAGE]}>
            <button
              className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('roles')}
            >
              Управление ролями
            </button>
          </Can>
        </div>

        {activeTab === 'books' && (
          <div>
            <h2 className="mb-2">Все книги системы</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Управление всеми книгами в системе
            </p>

            <Link to="/admin/books" className="btn btn-primary">
              Перейти к управлению книгами →
            </Link>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="mb-2">Все пользователи ({users.length})</h2>
            
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Роль</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Статус</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const colors = getRoleBadgeColor(u.role);
                    const isCurrentUser = u.id === user?.id;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isCurrentUser ? 'rgba(79, 70, 229, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '1rem' }}>{u.id}</td>
                        <td style={{ padding: '1rem' }}>
                          {u.username}
                          {isCurrentUser && (
                            <span style={{ 
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              color: 'var(--primary-color)',
                              fontWeight: '500'
                            }}>
                              (вы)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>{u.email}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: colors.bg,
                            color: colors.color,
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: u.is_active ? '#d1fae5' : '#fee2e2',
                            color: u.is_active ? '#065f46' : '#92400e',
                          }}>
                            {u.is_active ? 'Активен' : 'Деактивирован'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Can permissions={[Permission.ROLES_MANAGE]}>
                              <select
                                value={u.role}
                                onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  opacity: isCurrentUser ? 0.5 : 1,
                                  cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                                }}
                                title={isCurrentUser ? 'Нельзя изменить свою роль' : undefined}
                              >
                                <option value={UserRole.GUEST}>Guest</option>
                                <option value={UserRole.USER}>User</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                              </select>
                            </Can>
                            
                            <Can permissions={[Permission.USERS_DELETE]}>
                              <button
                                onClick={() => toggleUserActive(u.id, u.is_active)}
                                className="btn btn-secondary"
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  fontSize: '0.875rem',
                                  opacity: isCurrentUser ? 0.5 : 1,
                                  cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                                }}
                                disabled={isCurrentUser}
                                title={isCurrentUser ? 'Нельзя деактивировать самого себя' : undefined}
                              >
                                {u.is_active ? 'Деактивировать' : 'Активировать'}
                              </button>
                            </Can>
                            
                            <Can permissions={[Permission.USERS_DELETE]}>
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="btn btn-danger"
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  fontSize: '0.875rem',
                                  opacity: isCurrentUser ? 0.5 : 1,
                                  cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                                }}
                                disabled={isCurrentUser}
                                title={isCurrentUser ? 'Нельзя удалить самого себя' : undefined}
                              >
                                Удалить
                              </button>
                            </Can>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <h2 className="mb-2">Управление ролями</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Назначайте и изменяйте роли пользователей
            </p>
            
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3>Доступные роли:</h3>
              <ul style={{ marginTop: '1rem', lineHeight: '2' }}>
                <li><strong>Guest</strong> - Просмотр публичного контента</li>
                <li><strong>User</strong> - Полный доступ к своим книгам и обменам</li>
                <li><strong>Admin</strong> - Полный доступ ко всем функциям системы</li>
              </ul>
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px',
                border: '1px solid #f59e0b'
              }}>
                <strong>⚠️ Важно:</strong> Администратор не может удалить или деактивировать самого себя. 
                Для изменения своей роли обратитесь к другому администратору.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;