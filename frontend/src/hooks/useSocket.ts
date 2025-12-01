import { useEffect, useState } from 'react';
import { 
  initSocket, 
  connectSocket, 
  disconnectSocket, 
  setupExchangeNotifications, 
  setupExchangeStatusUpdates,
  setupUserStatus 
} from '../services/socket';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const socket = initSocket();
    
    // Обработчики подключения
    socket.on('connect', () => {
      console.log('✅ Вебсокет подключен');
      setIsConnected(true);
      setIsConnecting(false);
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('🔌 Вебсокет отключен. Причина:', reason);
      setIsConnected(false);
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    if (user && !isConnected && !isConnecting) {
      console.log('🔄 Попытка подключения к вебсокетам для пользователя', user.id);
      
      setIsConnecting(true);
      
      const token = localStorage.getItem('token');
      if (token) {
        connectSocket(token)
          .then(() => {
            console.log('✅ Успешное подключение к вебсокетам');
            
            // Настраиваем уведомления о предложениях обмена
            const cleanupExchanges = setupExchangeNotifications((exchange) => {
              if (!notifications.some(n => n.id === exchange.id)) {
                setNotifications(prev => [...prev, {
                  id: exchange.id,
                  type: 'exchange',
                  title: 'Новое предложение обмена',
                  message: `Пользователь ${exchange.requester_username} хочет обменять вашу книгу "${exchange.book_title}"`,
                  bookId: exchange.book_id,
                  timestamp: new Date().toISOString(),
                  read: false
                }]);
              }
            });
            
            // Настраиваем уведомления об обновлении статуса обмена
            const cleanupStatus = setupExchangeStatusUpdates((update) => {
              setNotifications(prev => [...prev, {
                id: `status-${update.exchange_id}`,
                type: 'status_update',
                status: update.status,
                title: update.status === 'accepted' ? 'Обмен принят' : 'Обмен отклонен',
                message: `Ваше предложение обмена книги "${update.book_title}" было ${update.status === 'accepted' ? 'принято' : 'отклонено'}`,
                bookId: update.book_id,
                timestamp: new Date().toISOString(),
                read: false
              }]);
              
              setStatusUpdates(prev => [...prev, {
                ...update,
                timestamp: new Date().toISOString()
              }]);
            });
            
            // Настраиваем онлайн-статус пользователей
            const cleanupStatusUsers = setupUserStatus(({ user_id, isOnline }: { user_id: string; isOnline: boolean }) => {
              setOnlineStatus(prev => ({
                ...prev,
                [user_id]: isOnline
              }));
            });
            
            return () => {
              cleanupExchanges();
              cleanupStatus();
              cleanupStatusUsers();
            };
          })
          .catch(error => {
            console.error('❌ Ошибка подключения к вебсокетам:', error);
            setIsConnecting(false);
          });
      } else {
        console.error('❌ Токен не найден в localStorage');
        setIsConnecting(false);
      }
    }
    
    return () => {
      if (isConnected) {
        disconnectSocket();
      }
    };
  }, [user, isConnected, isConnecting, notifications]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearStatusUpdates = () => {
    setStatusUpdates([]);
  };

  const getIsUserOnline = (userId: string) => {
    return onlineStatus[userId] || false;
  };

  return {
    isConnected,
    isConnecting,
    notifications,
    statusUpdates,
    clearNotifications,
    markNotificationAsRead,
    clearStatusUpdates,
    getIsUserOnline,
    onlineStatus
  };
};