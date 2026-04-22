import React from 'react';

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  selectedGenre: string;
  onGenreChange: (value: string) => void;
  selectedCondition: string;
  onConditionChange: (value: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  search,
  onSearchChange,
  onSearchKeyDown,
  onSearchSubmit,
  selectedGenre,
  onGenreChange,
  selectedCondition,
  onConditionChange,
}) => {
  const genres = [
    'Фантастика', 'Фэнтези', 'Детектив', 'Роман', 'Триллер', 
    'Биография', 'История', 'Наука', 'Классика', 'Детская литература'
  ];

  return (
    <div className="filters-card">
      <h3>Фильтры поиска</h3>
      
      <div className="form-group">
        <label className="form-label">Поиск по книгам</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Название, автор или описание..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            style={{ flex: 1 }}
          />
          <button 
            onClick={onSearchSubmit}
            className="btn btn-primary"
            type="button"
            style={{ whiteSpace: 'nowrap' }}
          >
            🔍 Найти
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Жанр</label>
        <select
          className="form-select"
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
        >
          <option value="">Все жанры</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Состояние</label>
        <select
          className="form-select"
          value={selectedCondition}
          onChange={(e) => onConditionChange(e.target.value)}
        >
          <option value="">Любое состояние</option>
          <option value="excellent">Отличное</option>
          <option value="good">Хорошее</option>
          <option value="satisfactory">Удовлетворительное</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;