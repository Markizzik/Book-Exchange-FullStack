import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { booksAPI, PaginatedResponse } from '../services/api';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import { translateCondition, translateGenre } from '../utils/translations';

const Catalog: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  
  // Состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: 10
        };
        
        if (search) params.search = search;
        if (selectedGenre) params.genre = selectedGenre;
        if (selectedCondition) params.condition = selectedCondition;
        
        const response = await booksAPI.getBooks(params);
        const data: PaginatedResponse<Book> = response.data;
        
        setBooks(data.books);
        setTotalPages(data.total_pages);
        setTotalCount(data.total_count);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
      } finally {
        setLoading(false);
      }
    };

    // Добавляем задержку для поиска чтобы не делать запрос при каждом нажатии клавиши
    const timeoutId = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timeoutId);
  }, [search, selectedGenre, selectedCondition, currentPage]);

  // Сбрасываем на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedGenre, selectedCondition]);

  const clearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setSelectedCondition('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Прокручиваем страницу вверх при смене страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <h1>Каталог книг для обмена</h1>
        <p>Найдите свою следующую книгу среди тысяч предложений</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Боковая панель с фильтрами */}
        <div>
          <Filters
            search={search}
            onSearchChange={setSearch}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            selectedCondition={selectedCondition}
            onConditionChange={setSelectedCondition}
          />
          
          {(search || selectedGenre || selectedCondition) && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <button 
                onClick={clearFilters}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Основной контент - список книг */}
        <div>
          <div className="card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0 }}>
                Найдено книг: {totalCount}
              </h2>
              {(search || selectedGenre || selectedCondition) && (
                <div style={{ color: 'var(--text-secondary)' }}>
                  {search && `Поиск: "${search}"`}
                  {selectedGenre && ` • Жанр: ${selectedGenre}`}
                  {selectedCondition && ` • Состояние: ${translateCondition(selectedCondition)}`}
                </div>
              )}
            </div>

            {books.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                <h3>Книги не найдены</h3>
                <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
              </div>
            ) : (
              <>
                <div className="book-list">
                  {books.map(book => (
                    <Link to={`/book/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }} key={book.id}>
                      <div className="book-item">
                        {book.cover_url ? (
                          <img  
                            src={book.cover_url}  
                            alt={book.title}
                            className="book-cover-vertical"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                            }}
                          />
                        ) : (
                          <div className="book-cover-placeholder-vertical">
                            📚
                          </div>
                        )}
                        
                        <div className="book-content-vertical">
                          <div className="book-header">
                            <h3 className="book-title-vertical">{book.title}</h3>
                            <div className="book-meta-vertical">
                              {book.genre && (
                                <span className="book-tag">{translateGenre(book.genre)}</span>
                              )}
                              {book.condition && (
                                <span className="book-tag">
                                  {translateCondition(book.condition)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="book-author-vertical">
                            <strong>Автор:</strong> {book.author}
                          </p>
                          
                          {book.description && (
                            <p className="book-description">
                              {book.description.length > 200 
                                ? `${book.description.substring(0, 200)}...` 
                                : book.description
                              }
                            </p>
                          )}
                          
                          <div className="book-footer">
                            <div className="book-owner">
                              <span>Добавлено: </span>
                              <Link 
                                to={`/user/${book.owner.id}`} 
                                className="user-link"
                                style={{ color: 'var(--primary-color)', fontWeight: '500', textDecoration: 'none' }}
                              >
                                {book.owner.username}
                              </Link>
                              {book.owner.city && (
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '5px' }}>
                                  ({book.owner.city})
                                </span>
                              )}
                            </div>
                            <div className="book-date">
                              {new Date(book.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Пагинация */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;