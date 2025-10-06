import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { booksAPI } from '../services/api';

const Catalog: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await booksAPI.getBooks();
        setBooks(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

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
        <h1>Найди свою следующую книгу</h1>
        <p>Обменивайтесь книгами с другими читателями совершенно бесплатно</p>
      </div>

      <div className="card">
        <h2 className="text-center mb-3">Каталог книг</h2>
        
        {books.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <h3>Пока нет доступных книг</h3>
            <p>Будьте первым, кто добавит книгу для обмена!</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
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
                  </div>
                  
                  {book.description && (
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {book.description}
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

export default Catalog;