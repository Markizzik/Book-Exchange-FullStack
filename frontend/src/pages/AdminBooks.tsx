import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Book, UserRole } from '../types';
import api from '../services/api';
import Can from '../components/Can';
import { Permission } from '../types';

const AdminBooks: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      navigate('/unauthorized');
      return;
    }
    loadBooks();
  }, [user, navigate, currentPage]);

  const loadBooks = async () => {
    try {
      const response = await api.get(`/books/admin/all-books?page=${currentPage}&limit=50`);
      setBooks(response.data.books);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.total_count);
    } catch (err: any) {
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту книгу?')) {
      return;
    }

    try {
      await api.delete(`/books/${bookId}`);
      await loadBooks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка удаления книги');
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
        <h1>Управление книгами</h1>
        <p>Администрирование всех книг в системе ({totalCount})</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/admin" className="btn btn-secondary">
            ← Назад в админ-панель
          </Link>
        </div>

        {books.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3>В системе нет книг</h3>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card">
                {book.cover_url ? (
                  <img  
                    src={book.cover_url}  
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
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Владелец: <Link to={`/user/${book.owner.id}`} style={{ color: 'var(--primary-color)' }}>{book.owner.username}</Link>
                  </p>
                  
                  <div className="book-meta">
                    <span className="book-tag" style={{ 
                      backgroundColor: book.status === 'available' ? '#d1fae5' : '#fef3c7',
                      color: book.status === 'available' ? '#065f46' : '#92400e'
                    }}>
                      {book.status === 'available' ? 'Доступна' : 'Обменена'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <Can permissions={[Permission.BOOKS_EDIT]}>
                      <Link 
                        to={`/edit-book/${book.id}`} 
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                      >
                        Редактировать
                      </Link>
                    </Can>
                    
                    <Can permissions={[Permission.BOOKS_DELETE]}>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                      >
                        Удалить
                      </button>
                    </Can>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '2rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Назад
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>
              Страница {currentPage} из {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Вперед →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBooks;