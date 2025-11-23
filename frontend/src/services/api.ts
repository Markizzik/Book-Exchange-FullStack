import axios from 'axios';
import { AuthResponse, Book, User } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => api.post<AuthResponse>('/auth/register', userData),

  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post<AuthResponse>('/auth/login', formData);
  },
};

export interface PaginatedResponse<T> {
  books: T[];
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

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