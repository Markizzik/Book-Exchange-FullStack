import axios from 'axios';
import { Book, User, Exchange, ExchangeResponse, UserResponse } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  console.log(`📡 [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  console.log('🍪 Cookies будут отправлены:', config.withCredentials);
  console.log('📦 Headers:', config.headers);
  return config;
});

let isRefreshing = false;
type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
};
let failedQueue: QueueItem[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => {
    console.log(`✅ [API] ${response.status} ${response.config.url}`);
    return response;
  },
  async error => {
    const originalRequest = error.config;
    console.log(`❌ [API] ${error.response?.status || 'NO_RESPONSE'} ${originalRequest?.url}`);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Пытаемся обновить токен...');
        await api.post('/auth/refresh', {});
        console.log('✅ Токен обновлён, повторяем запрос...');
        
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Не удалось обновить токен:', refreshError);
        processQueue(refreshError);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => api.post<UserResponse>('/auth/register', userData),

  login: (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    return api.post<UserResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get<User>('/auth/me'),
};

export interface PaginatedResponse<T> {
  books: T[];
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export const exchangesAPI = {
  createExchange: (exchangeData: any) => api.post<ExchangeResponse>('/exchanges/', exchangeData),
  getMyExchanges: () => api.get<Exchange[]>(`/exchanges/my-requests`),
  getMyOffers: () => api.get<Exchange[]>(`/exchanges/my-offers`),
  acceptExchange: (exchangeId: number) => api.put<ExchangeResponse>(`/exchanges/${exchangeId}/accept`),
  rejectExchange: (exchangeId: number) => api.put<ExchangeResponse>(`/exchanges/${exchangeId}/reject`),
  cancelExchange: (exchangeId: number) => api.delete(`/exchanges/${exchangeId}/cancel`),
};

export const booksAPI = {
  getBooks: (params?: {
    page?: number;
    limit?: number;
    genre?: string;
    condition?: string;
    search?: string;
  }) => api.get<PaginatedResponse<Book>>('/books/', { params }),
  getMyBooks: () => api.get<Book[]>('/books/my-books'),
  getBook: (id: number) => api.get<Book>(`/books/${id}`),
  createBook: (formData: FormData) => api.post<Book>('/books/', formData),
  updateBook: (id: number, formData: FormData) => api.put<Book>(`/books/${id}`, formData),
  deleteBook: (id: number) => api.delete(`/books/${id}`),
  getUserProfile: (userId: number) => api.get<User>(`/auth/profile/${userId}`),
  getUserBooks: (userId: number) => api.get<Book[]>(`/auth/profile/${userId}/books`),
};

export default api;