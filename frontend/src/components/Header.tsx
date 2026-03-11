import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Can from './Can';
import { Permission, UserRole } from '../types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span style={{ fontSize: '1.75rem' }}>📚</span>
            Обмен Книг
          </Link>
          
          <nav className="nav-items">
            {user ? (
              <>
                <span className="user-greeting">Привет, {user.username}!</span>
                <Link to="/profile" className="nav-link">Мой профиль</Link>
                <Can permissions={[Permission.BOOKS_CREATE]}>
                  <Link to="/add-book" className="nav-link">Добавить книгу</Link>
                </Can>
                <Can permissions={[Permission.ADMIN_ACCESS]}>
                  <Link to="/admin" className="nav-link" style={{ color: '#dc2626' }}>
                    Админ-панель
                  </Link>
                </Can>
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Войти</Link>
                <Link to="/register" className="btn btn-primary">Регистрация</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;