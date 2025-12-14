import socketio
from jose import jwt
from typing import Dict, Set, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .database import get_db
from .models import User, Exchange, Book
from datetime import datetime
from dotenv import load_dotenv
import os
import json

from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

class SocketManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
            allow_upgrades=True,
            ping_timeout=60,
            ping_interval=25,
            logger=True,
            engineio_logger=True
        )
        self.app = socketio.ASGIApp(self.sio, socketio_path='socket.io')
        self.online_users: Dict[str, Set[str]] = {}
        self.setup_events()
    
    def setup_events(self):
        @self.sio.event
        async def connect(sid, environ, auth):
            print(f"Клиент подключен: {sid}")
            query_string = environ.get('QUERY_STRING', '')
            token = None
            
            if 'token=' in query_string:
                token = query_string.split('token=')[1].split('&')[0]
            
            if token:
                try:
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    user_id = payload.get('user_id')
                    
                    if user_id:
                        user_id_str = str(user_id)
                        if user_id_str not in self.online_users:
                            self.online_users[user_id_str] = set()
                        self.online_users[user_id_str].add(sid)
                        await self.sio.save_session(sid, {'user_id': user_id_str})
                        await self.sio.emit('auth_success', {'user_id': user_id_str}, to=sid)
                        await self.send_pending_exchanges(user_id_str)
                        return True
                except Exception as e:
                    print(f"Ошибка аутентификации: {str(e)}")
                    await self.sio.emit('auth_error', {'error': str(e)}, to=sid)
            
            await self.sio.emit('auth_error', {'error': 'Требуется аутентификация'}, to=sid)
            return False

        @self.sio.event
        async def disconnect(sid):
            print(f"Клиент отключен: {sid}")
            user_id_to_remove = None
            for user_id, sessions in self.online_users.items():
                if sid in sessions:
                    user_id_to_remove = user_id
                    sessions.remove(sid)
                    if not sessions:
                        del self.online_users[user_id]
                    break
            
            if user_id_to_remove:
                await self.sio.emit('user_offline', {'user_id': user_id_to_remove})
                print(f"Пользователь {user_id_to_remove} отключен")

        @self.sio.event
        async def authenticate(sid, token_data):
            try:
                if not isinstance(token_data, dict):
                    token_data = json.loads(token_data)
                
                token = token_data.get('token')
                user_id = token_data.get('user_id')
                
                if not token or not user_id:
                    await self.sio.emit('auth_error', {'error': 'Требуется токен и user_id'}, to=sid)
                    print("Ошибка аутентификации: отсутствует токен или user_id")
                    return False
                
                if user_id not in self.online_users:
                    self.online_users[user_id] = set()
                self.online_users[user_id].add(sid)
                
                await self.sio.save_session(sid, {'user_id': user_id})
                await self.sio.emit('auth_success', {'user_id': user_id}, to=sid)
                print(f"Пользователь {user_id} успешно прошел аутентификацию")
                
                await self.send_pending_exchanges(user_id, sid)
                return True
                
            except Exception as e:
                error_msg = str(e)
                print(f"Ошибка аутентификации: {error_msg}")
                await self.sio.emit('auth_error', {'error': error_msg}, to=sid)
                return False

    async def send_pending_exchanges(self, user_id: str, sid: Optional[str] = None):
        """Отправка уведомлений о новых предложениях обмена"""
        try:
            db = next(get_db())
            exchanges = db.query(Exchange).join(Book).filter(
                Exchange.owner_id == int(user_id),
                Exchange.status == 'pending'
            ).all()
            
            notifications = []
            for exchange in exchanges:
                notifications.append({
                    'id': exchange.id,
                    'book_id': exchange.book_id,
                    'book_title': exchange.book.title if exchange.book else 'Неизвестная книга',
                    'requester_id': exchange.requester_id,
                    'requester_username': exchange.requester.username if exchange.requester else 'Неизвестный пользователь',
                    'created_at': exchange.created_at.isoformat() if exchange.created_at else ''
                })
            
            if notifications:
                if sid:
                    await self.sio.emit('new_exchanges', {'exchanges': notifications}, to=sid)
                else:
                    if user_id in self.online_users:
                        for session_id in self.online_users[user_id]:
                            await self.sio.emit('new_exchanges', {'exchanges': notifications}, to=session_id)
                print(f"Отправлено {len(notifications)} уведомлений пользователю {user_id}")
                
        except Exception as e:
            print(f"Ошибка отправки уведомлений: {str(e)}")
        finally:
            db.close()

    async def notify_new_exchange(self, exchange_id: int):
        """Уведомление о новом предложении обмена"""
        try:
            db = next(get_db())
            exchange = db.query(Exchange).get(exchange_id)
            if exchange:
                await self.send_pending_exchanges(str(exchange.owner_id))
                print(f"Уведомление о новом обмене ID {exchange_id} отправлено владельцу {exchange.owner_id}")
        except Exception as e:
            print(f"Ошибка уведомления о новом обмене: {str(e)}")
        finally:
            db.close()


    async def notify_exchange_status_update(self, exchange_id: int, status: str):
        """Уведомление об обновлении статуса обмена"""
        try:
            db = next(get_db())
            exchange = db.query(Exchange).get(exchange_id)
            if exchange:
                if str(exchange.requester_id) in self.online_users:
                    for session_id in self.online_users[str(exchange.requester_id)]:
                        await self.sio.emit('exchange_status_update', {
                            'exchange_id': exchange.id,
                            'book_title': exchange.book.title if exchange.book else 'Неизвестная книга',
                            'status': status
                        }, to=session_id)
                    print(f"Уведомление о статусе обмена ID {exchange_id} отправлено запрашивающему {exchange.requester_id}")
        except Exception as e:
            print(f"Ошибка уведомления о статусе обмена: {str(e)}")
        finally:
            db.close()