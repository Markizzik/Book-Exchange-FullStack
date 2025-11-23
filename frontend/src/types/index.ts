export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  city: string | null;
  about: string | null;
  created_at: string;
}

export interface UserBasic {
  id: number;
  username: string;
  city: string | null;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string | null;
  genre: string | null;
  condition: string | null;
  cover: string | null;
  owner_id: number;
  owner: UserBasic; // Добавляем владельца
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}