import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';
import { booksAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        const response = await booksAPI.getMyBooks();
        setMyBooks(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBooks();
  }, []);

  const handleDeleteBook = async (bookId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту книгу?')) {
      try {
        await booksAPI.deleteBook(bookId);
        setMyBooks(myBooks.filter(book => book.id !== bookId));
      } catch (error) {
        console.error('Ошибка при удалении книги:', error);
        alert('Не удалось удалить книгу');
      }
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
        <h1>Мой профиль</h1>
        <p>Управляйте вашими книгами и данными</p>
      </div>

      <div className="card mb-3">
        <h2 className="mb-2">Информация о пользователе</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Имя пользователя
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.username}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Email
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.email}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Полное имя
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.full_name || 'Не указано'}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Город
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.city || 'Не указан'}</p>
          </div>
        </div>
        
        {user?.about && (
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>Мои книги</h2>
          <Link to="/add-book" className="btn btn-primary">
            + Добавить книгу
          </Link>
        </div>
        
        {myBooks.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3>У вас пока нет книг</h3>
            <p>Добавьте свою первую книгу для обмена!</p>
            <Link to="/add-book" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Добавить книгу
            </Link>
          </div>
        ) : (
          <div className="books-grid">
            {myBooks.map(book => (
              <div key={book.id} className="book-card">
                {book.cover ? (
                  <img 
                    src={`http://localhost:8000/uploads/covers/${book.cover}`} 
                    alt={book.title}
                    className="book-cover"
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
                      <span className="book-tag">{book.genre}</span>
                    )}
                    {book.condition && (
                      <span className="book-tag">
                        {book.condition === 'excellent' && 'Отличное'}
                        {book.condition === 'good' && 'Хорошее'}
                        {book.condition === 'satisfactory' && 'Удовлетворительное'}
                      </span>
                    )}
                    <span className="book-tag" style={{ 
                      backgroundColor: book.status === 'available' ? '#d1fae5' : '#fef3c7',
                      color: book.status === 'available' ? '#065f46' : '#92400e'
                    }}>
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
                        : book.description
                      }
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link 
                      to={`/edit-book/${book.id}`} 
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                    >
                      Редактировать
                    </Link>
                    <button 
                      onClick={() => handleDeleteBook(book.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;