import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, User } from '../types';
import { booksAPI } from '../services/api';
import { translateCondition, translateGenre } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import UserStatusIndicator from '../components/UserStatusIndicator';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<any>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, booksResponse] = await Promise.all([
          booksAPI.getUserProfile(Number(userId)),
          booksAPI.getUserBooks(Number(userId))
        ]);
        setUser(userResponse.data);
        setUserBooks(booksResponse.data);
      } catch (err: any) {
        setError('Не удалось загрузить профиль пользователя');
        console.error('Error fetching user ', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>{error}</h3>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>Пользователь не найден</h3>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Профиль пользователя</h1>
        <p>Информация о пользователе и его книжной коллекции</p>
      </div>
      
      <div className="card mb-3">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
           <h2 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            margin: 0 
          }}>
            {user.username}
            <UserStatusIndicator userId={user.id} size={16} />
          </h2>
          {currentUser?.id === user.id && (
            <button 
              onClick={() => navigate('/profile')} 
              className="btn btn-secondary"
            >
              Мой профиль
            </button>
          )}
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Полное имя
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {user.full_name || 'Не указано'}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Город
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {user.city || 'Не указан'}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Email
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {user.email}
            </p>
          </div>
        </div>
        
        {user.about && (
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              О себе
            </label>
            <p style={{ 
              marginTop: '0.5rem',
              padding: '1rem',
              background: 'var(--secondary-color)',
              borderRadius: '8px',
              lineHeight: '1.6'
            }}>
              {user.about}
            </p>
          </div>
        )}
      </div>
      
      <div className="card">
        <h2>Книги пользователя ({userBooks.length})</h2>
        
        {userBooks.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3>У пользователя нет доступных книг</h3>
            <p>Возможно, все книги уже находятся в процессе обмена</p>
          </div>
        ) : (
          <div className="books-grid">
            {userBooks.map(book => (
              <div key={book.id} className="book-card">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url}
                    alt={book.title}
                    className="book-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                    }}
                  />
                ) : (
                  <div 
                    className="book-cover"  
                    style={{  
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '3rem'
                    }}
                  >
                    📚
                  </div>
                )}
                <div className="book-content">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">Автор: {book.author}</p>
                  <div className="book-meta">
                    {book.genre && (
                      <span className="book-tag">{translateGenre(book.genre)}</span>
                    )}
                    {book.condition && (
                      <span className="book-tag">{translateCondition(book.condition)}</span>
                    )}
                    <span className={`book-tag ${
                      book.status === 'available' ? 'book-tag-available' : 'book-tag-unavailable'
                    }`}>
                      {book.status === 'available' ? 'Доступна' : 'Обменена'}
                    </span>
                  </div>
                  {book.description && (
                    <p style={{  
                      color: 'var(--text-secondary)',  
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      marginBottom: '1rem'
                    }}>
                      {book.description.length > 100 
                        ? `${book.description.substring(0, 100)}...` 
                        : book.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;