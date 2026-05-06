import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';

const AddBook: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    condition: ''
  });
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCover(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('description', formData.description);
    data.append('genre', formData.genre);
    data.append('condition', formData.condition);
    if (cover) {
      data.append('cover', cover);
    }

    try {
      await booksAPI.createBook(data);
      navigate('/profile');
    } catch (err: any) {
      let message = 'Не удалось добавить книгу. Попробуйте снова.';
      if (err.response?.status === 422 && Array.isArray(err.response.data?.detail)) {
        message = err.response.data.detail[0]?.msg || message;
      } else if (err.response?.data?.detail) {
        message = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : message;
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card">
          <h2 className="text-center mb-3">Добавить новую книгу</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Название книги *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Введите название книги"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Автор *</label>
              <input
                type="text"
                name="author"
                className="form-input"
                value={formData.author}
                onChange={handleChange}
                required
                placeholder="Введите автора книги"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Опишите книгу (состояние, сюжет и т.д.)"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Жанр</label>
              <input
                type="text"
                name="genre"
                className="form-input"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Например: Фантастика, Детектив, Роман"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Состояние</label>
              <select
                name="condition"
                className="form-select"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="">Выберите состояние</option>
                <option value="excellent">Отличное</option>
                <option value="good">Хорошее</option>
                <option value="satisfactory">Удовлетворительное</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Обложка книги</label>
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {cover ? cover.name : 'Нажмите для загрузки обложки'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Рекомендуется изображение 3:4
                  </div>
                </label>
              </div>
              <small style={{ color: 'var(--text-secondary)', display: 'block' }}>
                Поддерживаются форматы: JPEG, PNG, WEBP
              </small>
            </div>

            {error && (
              <div style={{ 
                color: '#dc2626', 
                backgroundColor: '#fef2f2',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
                    Добавление...
                  </>
                ) : (
                  'Добавить книгу'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBook;