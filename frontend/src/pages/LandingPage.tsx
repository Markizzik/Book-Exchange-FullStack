import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../utils/SEO';
import LandingWeather from '../components/LandingWeather'; // ← Новый импорт

const LandingPage: React.FC = () => {
  return (
    <>
      <SEO 
        title="Book Exchange — Обмен книгами" 
        description="Платформа для обмена книгами. Найдите новую книгу, обменяйте старую. Бесплатно и удобно."
      />
      <main className="landing-page">
        {/* Hero Section */}
        <section className="hero" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Обмен Книгами</h1>
          <p style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Дайте своим книгам вторую жизнь. Найдите редкие издания или обменяйте прочитанное на что-то новое.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/catalog" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Найти книгу
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Регистрация
            </Link>
          </div>
        </section>

        {/* === НОВЫЙ БЛОК: Погода === */}
        <section style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>🌤️ Погода для встреч</h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Узнайте погоду в вашем городе — удобно планировать встречу для обмена книгой!
          </p>
          <LandingWeather defaultCity="Москва" />
        </section>

        {/* Features Section */}
        <section className="features" style={{ padding: '4rem 1rem', background: '#f9fafb' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Как это работает?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <h3>Добавьте книгу</h3>
                <p>Загрузите фото и описание книги, которую хотите отдать.</p>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
                <h3>Предложите обмен</h3>
                <p>Нашли интересное предложение? Отправьте запрос владельцу.</p>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
                <h3>Обменяйтесь</h3>
                <p>Договоритесь о встрече и наслаждайтесь новой историей.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default LandingPage;