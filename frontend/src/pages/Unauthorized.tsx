import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="card text-center" style={{ padding: '3rem', maxWidth: '600px', margin: '3rem auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h2>Доступ запрещён</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          У вас недостаточно прав для доступа к этой странице
        </p>
        
        {user ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <Link to="/" className="btn btn-primary">
              На главную
            </Link>
            <Link to="/profile" className="btn btn-secondary">
              Мой профиль
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <Link to="/" className="btn btn-primary">
              На главную
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Войти
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unauthorized;