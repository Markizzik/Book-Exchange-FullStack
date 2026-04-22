import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Exchange, User } from '../types';
import { booksAPI, exchangesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { translateCondition, translateGenre } from '../utils/translations';
import { SEO } from '../utils/SEO';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await booksAPI.getBook(Number(id));
        setBook(response.data);
      } catch (err: any) {
        setError('Не удалось загрузить информацию о книге');
        console.error('Error fetching book:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchExchanges = async () => {
      if (user) {
        try {
          const response = await exchangesAPI.getMyExchanges();
          setExchanges(response.data.filter(ex => ex.book_id === Number(id) && ex.status === 'pending'));
        } catch (err) {
          console.error('Error fetching exchanges:', err);
        }
      }
    };

    fetchBook();
    if (user) {
      fetchExchanges();
    }
  }, [id, user]);

  const handleExchangeRequest = async () => {
    if (!user || !book || book.owner_id === user.id) return;
    
    setExchangeLoading(true);
    try {
      const newExchange = {
        book_id: book.id,
        requester_id: user.id,
        owner_id: book.owner_id
      };
      
      await exchangesAPI.createExchange(newExchange);
      
      // Обновляем список обменов после создания
      const response = await exchangesAPI.getMyExchanges();
      setExchanges(response.data.filter(ex => ex.book_id === book.id && ex.status === 'pending'));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось создать предложение обмена');
    } finally {
      setExchangeLoading(false);
    }
  };

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
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>Книга не найдена</h3>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === book.owner_id;
  const hasPendingExchange = exchanges.some(ex => ex.requester_id === user?.id && ex.status === 'pending');

  return (
    <div className="container">
      {/* SEO Component with JSON-LD */}
      <SEO
        title={`${book.title} — ${book.author}`}
        description={book.description || `Обмен книги ${book.title} автора ${book.author}`}
        image={book.cover_url || undefined}
        type="book"
        jsonLd={{
          "@context": "https://schema.org/",
          "@type": "Book",
          "name": book.title,
          "author": {
            "@type": "Person",
            "name": book.author
          },
          "description": book.description,
          "image": book.cover_url,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "RUB",
            "availability": book.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }}
      />

      <div className="hero">
        <h2>Детальная информация о книге</h2>
        <p>Узнайте больше о книге и возможности обмена</p>
      </div>
      
      <div className="card">
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 300px', minWidth: '250px' }}>
            {book.cover_url ? (
              <img 
                src={book.cover_url}
                alt={book.title}
                style={{ 
                  width: '100%', 
                  height: '450px', 
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '450px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '4rem'
              }}>
                📚
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>
              {book.title}
            </h1>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
              Автор: <strong>{book.author}</strong>
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0', flexWrap: 'wrap' }}>
              {book.genre && (
                <dl className="book-tag" style={{ padding: '0.5rem 1rem' }}>
                  {translateGenre(book.genre)}
                </dl>
              )}
              {book.condition && (
                <dl className="book-tag" style={{ padding: '0.5rem 1rem' }}>
                  {translateCondition(book.condition)}
                </dl>
              )}
              <span className="book-tag" style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: book.status === 'available' ? '#d1fae5' : '#fef3c7',
                color: book.status === 'available' ? '#065f46' : '#92400e'
              }}>
                {book.status === 'available' ? 'Доступна для обмена' : 'Обменена'}
              </span>
            </div>
            
            <div style={{ 
              background: 'var(--secondary-color)', 
              padding: '1.5rem', 
              borderRadius: '8px',
              marginTop: '1.5rem',
              lineHeight: '1.6'
            }}>
              <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>Описание</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                {book.description || 'Описание отсутствует'}
              </p>
            </div>
            
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'var(--secondary-color)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                    Добавлено пользователем
                  </h3>
                  <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>
                    <strong>{book.owner.username}</strong>
                    {book.owner.city && ` из ${book.owner.city}`}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Добавлено: {new Date(book.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
            
            {!isOwner && book.status === 'available' && (
              <div style={{ marginTop: '2rem' }}>
                {hasPendingExchange ? (
                  <div style={{ 
                    padding: '1.5rem', 
                    background: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#92400e', margin: 0 }}>
                      Уже отправлено предложение обмена
                    </h3>
                    <p style={{ color: '#92400e', margin: '0.5rem 0' }}>
                      Ваше предложение ожидает подтверждения от владельца книги
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleExchangeRequest}
                    disabled={exchangeLoading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem' }}
                  >
                    {exchangeLoading ? 'Отправка запроса...' : 'Предложить обмен'}
                  </button>
                )}
              </div>
            )}
            
            {isOwner && book.status === 'available' && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Текущие предложения обмена
                </h3>
                {exchanges.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {exchanges.map(exchange => {
                      const requester = exchange.requester as User;
                      
                      return (
                        <div key={exchange.id} style={{ 
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          background: 'white'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                                Предложение от пользователя {requester.username}
                              </h4>
                              {requester.city && (
                                <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                  {requester.city}
                                </p>
                              )}
                              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                Запрошено: {new Date(exchange.created_at).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button 
                                onClick={async () => {
                                  try {
                                    await exchangesAPI.acceptExchange(exchange.id);
                                    // Обновляем данные после принятия
                                    const response = await booksAPI.getBook(Number(id));
                                    setBook(response.data);
                                  } catch (err) {
                                    console.error('Error accepting exchange:', err);
                                  }
                                }}
                                className="btn btn-success"
                                style={{ padding: '0.5rem 1rem' }}
                              >
                                Принять
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    await exchangesAPI.rejectExchange(exchange.id);
                                    // Обновляем данные после отклонения
                                    setExchanges(exchanges.filter(ex => ex.id !== exchange.id));
                                  } catch (err) {
                                    console.error('Error rejecting exchange:', err);
                                  }
                                }}
                                className="btn btn-danger"
                                style={{ padding: '0.5rem 1rem' }}
                              >
                                Отклонить
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>
                    Нет активных предложений обмена
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/*<Recommendations bookId={book.id} />*/}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Вернуться в каталог
        </button>
      </div>
    </div>
  );
};

export default BookDetail;