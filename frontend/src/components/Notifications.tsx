import React from 'react';
import { useSocket } from '../hooks/useSocket';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, XCircle } from 'react-feather';

const Notifications: React.FC = () => {
  const { 
    notifications, 
    clearNotifications, 
    markNotificationAsRead,
    statusUpdates,
    clearStatusUpdates
  } = useSocket();
 
  // Фильтруем только непрочитанные уведомления
  const unreadNotifications = notifications.filter(n => !n.read);
 
  return (
    <div style={{ 
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px'
    }} >
      {/* Уведомления о новых предложениях обмена */}
      {unreadNotifications.map((notification, index) => (
        <div key={notification.id} style={{ 
          background: 'white',
          border: notification.type === 'exchange' 
            ? '1px solid #4f46e5' 
            : notification.status === 'accepted' 
              ? '1px solid #059669' // Зеленая обводка для принятых обменов
              : '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          animation: 'slideIn 0.3s forwards',
          position: 'relative',
          overflow: 'hidden'
        }} >
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: notification.type === 'exchange' 
              ? '#4f46e5' 
              : notification.status === 'accepted' 
                ? '#059669' // Зеленый цвет для принятых обменов
                : '#ef4444'
          }}></div>
          
          <button  
            onClick={() => markNotificationAsRead(notification.id)}
            style={{ 
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.5,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          >
            <span style={{ fontSize: '20px' }}>×</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }} >
            {notification.type === 'exchange' ? (
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '12px',
                background: 'rgba(79, 70, 229, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} >
                <Bell size={20} color="#4f46e5" />
              </div>
            ) : notification.status === 'accepted' ? (
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '12px',
                background: 'rgba(5, 150, 105, 0.1)', // Темно-зеленый фон для иконки
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} >
                <CheckCircle size={20} color="#059669" /> {/* Темно-зеленая галочка */}
              </div>
            ) : (
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} >
                <XCircle size={20} color="#ef4444" />
              </div>
            )}
            <h4 style={{ 
              margin: 0, 
              color: notification.status === 'accepted' ? '#059669' : '#1e293b', // Зеленый цвет для заголовка принятых обменов
              fontWeight: 600,
              fontSize: '1rem'
            }} >
              {notification.title}
            </h4>
          </div>
          
          <p style={{ 
            color: '#64748b', 
            margin: '0.5rem 0',
            lineHeight: 1.5,
            fontSize: '0.95rem'
          }} >
            {notification.message}
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            marginTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1rem'
          }} >
            {notification.bookId && (
              <Link  
                to={`/book/${notification.bookId}`}  
                style={{ 
                  flex: 1,
                  padding: '0.6rem',
                  background: 'rgba(79, 70, 229, 0.05)',
                  color: '#4f46e5',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)'}
              >
                Посмотреть книгу
              </Link>
            )}
            <button  
              onClick={clearNotifications}
              style={{ 
                flex: 1,
                padding: '0.6rem',
                background: '#e2e8f0',
                color: '#4a5568',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#cbd5e1'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
            >
              Закрыть все
            </button>
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;