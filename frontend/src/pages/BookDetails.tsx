import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { booksAPI } from '../services/api';
import { translateCondition, translateGenre } from '../utils/translations';

const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await booksAPI.getBook(Number(id));
        setBook(response.data);
      } catch (err: any) {
        setError('Книга не найдена');
        console.error('Ошибка при загрузке книги:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Книга не найдена</h2>
          <p>{error || 'Запрошенная книга не существует'}</p>
          <Link to="/" className="btn btn-primary">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          ← Назад
        </button>
      </div>

      <div className="card">
        <div className="book-details">
          <div className="book-details-header">
            {book.cover_image ? (
              <img
                src={`http://localhost:8000/uploads/covers/${book.cover_image}`}
                alt={book.title}
                className="book-details-cover"
              />
            ) : (
              <div className="book-details-cover-placeholder">
                📚
              </div>
            )}
            
            <div className="book-details-info">
              <h1 className="book-details-title">{book.title}</h1>
              <p className="book-details-author">
                <strong>Автор:</strong> {book.author}
              </p>
              
              <div className="book-details-meta">
                {book.genre && (
                  <div className="book-details-meta-item">
                    <strong>Жанр:</strong> {translateGenre(book.genre)}
                  </div>
                )}
                {book.condition && (
                  <div className="book-details-meta-item">
                    <strong>Состояние:</strong> {translateCondition(book.condition)}
                  </div>
                )}
                <div className="book-details-meta-item">
                  <strong>Статус:</strong> {book.status === 'available' ? 'Доступна для обмена' : 'Недоступна'}
                </div>
                <div className="book-details-meta-item">
                  <strong>Добавлена:</strong> {new Date(book.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          </div>

          {book.description && (
            <div className="book-details-description">
              <h3>Описание</h3>
              <p>{book.description}</p>
            </div>
          )}

          <div className="book-details-owner">
            <h3>Владелец книги</h3>
            <div className="owner-info">
              <div className="owner-avatar">
                {book.owner.username.charAt(0).toUpperCase()}
              </div>
              <div className="owner-details">
                <div className="owner-username">{book.owner.username}</div>
                {book.owner.city && (
                  <div className="owner-city">📍 {book.owner.city}</div>
                )}
                {book.owner.full_name && (
                  <div className="owner-fullname">{book.owner.full_name}</div>
                )}
              </div>
            </div>
            {book.owner.about && (
              <div className="owner-about">
                <p>{book.owner.about}</p>
              </div>
            )}
          </div>

          <div className="book-details-actions">
            <button className="btn btn-primary">
              Предложить обмен
            </button>
            <button className="btn btn-secondary">
              Написать сообщение
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;