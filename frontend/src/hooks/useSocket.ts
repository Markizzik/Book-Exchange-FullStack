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
  const [cleanupFunctions, setCleanupFunctions] = useState<(() => void)[]>([]);

  useEffect(() => {
    if (!user || isConnected || isConnecting) return;

    console.log('🔄 Попытка подключения к вебсокетам для пользователя', user.id);
    setIsConnecting(true);
    cleanupFunctions.forEach(fn => fn());
    
    connectSocket()
      .then(() => {
        console.log('✅ Успешное подключение к вебсокетам');
        setIsConnected(true);

        const cleanupExchanges = setupExchangeNotifications((exchange) => {
          setNotifications(prev => {
            if (prev.some(n => n.id === exchange.id)) return prev;
            
            return [...prev, {
              id: exchange.id,
              type: 'exchange',
              title: 'Новое предложение обмена',
              message: `Пользователь ${exchange.requester_username} хочет обменять вашу книгу "${exchange.book_title}"`,
              bookId: exchange.book_id,
              timestamp: new Date().toISOString(),
              read: false
            }];
          });
        });

        const cleanupStatus = setupExchangeStatusUpdates((update) => {
          const notificationId = `status-${update.exchange_id}-${update.status}`;
          
          setNotifications(prev => {
            if (prev.some(n => n.id === notificationId)) return prev;
            
            return [...prev, {
              id: notificationId,
              type: 'status_update',
              status: update.status,
              title: update.status === 'accepted' ? 'Обмен принят' : 'Обмен отклонен',
              message: `Ваше предложение обмена книги "${update.book_title}" было ${update.status === 'accepted' ? 'принято' : 'отклонено'}`,
              bookId: update.book_id,
              timestamp: new Date().toISOString(),
              read: false
            }];
          });

          setStatusUpdates(prev => {
            if (prev.some(u => u.exchange_id === update.exchange_id && u.status === update.status)) return prev;
            
            return [...prev, {
              ...update,
              timestamp: new Date().toISOString()
            }];
          });
        });

        const cleanupUserStatus = setupUserStatus(({ user_id, isOnline }: { user_id: string; isOnline: boolean }) => {
          setOnlineStatus(prev => ({
            ...prev,
            [user_id]: isOnline
          }));
        });

        setCleanupFunctions([cleanupExchanges, cleanupStatus, cleanupUserStatus]);
        setIsConnecting(false);
      })
      .catch(error => {
        console.error('❌ Ошибка подключения к вебсокетам:', error);
        setIsConnecting(false);
      });

    return () => {
      cleanupFunctions.forEach((fn: () => void) => fn());
      if (isConnected) {
        disconnectSocket();
        setIsConnected(false);
      }
    };
  }, [user, isConnected, isConnecting]);

  useEffect(() => {
    const socket = initSocket();
    
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

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
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