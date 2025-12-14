import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, BookOpen } from 'react-feather';
import { useSocket } from '../hooks/useSocket';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const BellWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
`;

const Dropdown = styled.div<{isOpen: boolean}>`
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 1rem;
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  max-height: 500px;
  overflow-y: auto;
  margin-top: 8px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0.75rem;
`;

const NotificationItem = styled.div<{read: boolean}>`
  background: ${props => props.read ? 'rgba(241, 245, 249, 0.5)' : 'white'};
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const NotificationContent = styled.div`
  display: flex;
  gap: 12px;
`;

const IconContainer = styled.div<{status: 'exchange' | 'accepted' | 'rejected'}>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch(props.status) {
      case 'exchange': return 'rgba(79, 70, 229, 0.1)';
      case 'accepted': return 'rgba(5, 150, 105, 0.1)';
      case 'rejected': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(241, 245, 249, 1)';
    }
  }};
`;

const NotificationText = styled.div`
  flex: 1;
`;

const Title = styled.h4<{status: 'exchange' | 'accepted' | 'rejected'}>`
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => {
    switch(props.status) {
      case 'accepted': return '#059669';
      case 'rejected': return '#ef4444';
      default: return '#1e293b';
    }
  }};
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
  line-height: 1.4;
`;

const Time = styled.span`
  font-size: 0.7rem;
  color: #94a3b8;
  display: block;
  margin-top: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
  
  &:hover {
    background: #f1f5f9;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.75rem;
`;

const ViewAllButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #4b5563;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
  }
`;

const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    clearNotifications,
    statusUpdates
  } = useSocket();
  
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Фильтруем только непрочитанные уведомления для badge
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Получаем все уведомления для истории
  const allNotifications = [...notifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Закрываем выпадающий список при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };
  
  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };
  
  const getIconComponent = (type: string, status?: string) => {
    if (type === 'exchange') {
      return <Bell size={16} color="#4f46e5" />;
    } else if (status === 'accepted') {
      return <CheckCircle size={16} color="#059669" />;
    } else {
      return <XCircle size={16} color="#ef4444" />;
    }
  };
  
  const getNotificationStatus = (notification: any) => {
    if (notification.type === 'exchange') return 'exchange';
    return notification.status || 'exchange';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <BellWrapper ref={bellRef}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Bell size={20} color="#4b5563" />
        {unreadCount > 0 && (
          <Badge>{unreadCount > 9 ? '9+' : unreadCount}</Badge>
        )}
      </div>
      
      <Dropdown ref={dropdownRef} isOpen={isOpen}>
        <Header>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
            Уведомления
          </h3>
          {allNotifications.length > 0 && (
            <ClearButton onClick={handleClearAll}>Очистить все</ClearButton>
          )}
        </Header>
        
        {allNotifications.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
            <p>Нет уведомлений</p>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Здесь появятся уведомления о предложениях обмена
            </p>
          </EmptyState>
        ) : (
          <>
            {allNotifications.map(notification => {
              const status = getNotificationStatus(notification);
              return (
                <NotificationItem key={notification.id} read={notification.read}>
                  <NotificationContent>
                    <IconContainer status={status}>
                      {getIconComponent(notification.type, notification.status)}
                    </IconContainer>
                    <NotificationText>
                      <Title status={status}>{notification.title}</Title>
                      <Message>{notification.message}</Message>
                      <Time>{formatDate(notification.timestamp)}</Time>
                    </NotificationText>
                  </NotificationContent>
                  
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                      title="Отметить как прочитанное"
                    >
                      ×
                    </button>
                  )}
                  
                  {notification.bookId && (
                    <ActionButtons>
                      <Link
                        to={`/book/${notification.bookId}`}
                        style={{ 
                          flex: 1,
                          padding: '0.4rem',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          color: '#4f46e5',
                          textDecoration: 'none',
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        Посмотреть книгу
                      </Link>
                    </ActionButtons>
                  )}
                </NotificationItem>
              );
            })}
            
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <ViewAllButton onClick={() => setIsOpen(false)}>
                Закрыть
              </ViewAllButton>
            </div>
          </>
        )}
      </Dropdown>
    </BellWrapper>
  );
};

export default NotificationBell;