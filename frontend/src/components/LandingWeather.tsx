import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
}

interface LandingWeatherProps {
  defaultCity?: string; // Город по умолчанию (например, "Москва")
}

const LandingWeather: React.FC<LandingWeatherProps> = ({ defaultCity = "Москва" }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState(defaultCity);
  const [inputCity, setInputCity] = useState(defaultCity);

  useEffect(() => {
    if (!userCity) return;
    
    const fetchWeather = async () => {
      try {
        const response = await api.get(`/books/weather/city?city=${encodeURIComponent(userCity)}`);
        setWeather(response.data);
      } catch (error) {
        console.error('Ошибка загрузки погоды:', error);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [userCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCity.trim()) {
      setUserCity(inputCity.trim());
      setLoading(true);
    }
  };

  // Показываем заглушку при загрузке или ошибке
  if (loading || !weather) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: '50px', height: '50px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            ⛅
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
              {loading ? 'Загрузка...' : 'Погода'}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{userCity}</div>
          </div>
        </div>
        
        {/* Форма поиска города */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            placeholder="Ваш город..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔍
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      color: 'white',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    }}>
      {/* Заголовок с городом */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
            {weather.city}
            {weather.country && <span style={{ opacity: 0.8 }}> ({weather.country})</span>}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, textTransform: 'capitalize' }}>
            {weather.description}
          </div>
        </div>
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
          alt={weather.description}
          style={{ width: '60px', height: '60px' }}
        />
      </div>

      {/* Температура */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>{weather.temp}°C</span>
        <span style={{ opacity: 0.8 }}>Ощущается как {weather.feels_like}°C</span>
      </div>

      {/* Детали */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.75rem',
        marginBottom: '1.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          💧 Влажность: {weather.humidity}%
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          💨 Ветер: {weather.wind_speed} м/с
        </div>
      </div>

      {/* Форма смены города */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          placeholder="Другой город..."
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            background: 'white',
            color: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Показать
        </button>
      </form>
    </div>
  );
};

export default LandingWeather;