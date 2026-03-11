export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin'
}

export enum Permission {
  BOOKS_VIEW = 'books:view',
  BOOKS_CREATE = 'books:create',
  BOOKS_EDIT = 'books:edit',
  BOOKS_DELETE = 'books:delete',
  BOOKS_EDIT_ANY = 'books:edit:any',
  BOOKS_DELETE_ANY = 'books:delete:any',
  EXCHANGES_VIEW = 'exchanges:view',
  EXCHANGES_CREATE = 'exchanges:create',
  EXCHANGES_ACCEPT = 'exchanges:accept',
  EXCHANGES_REJECT = 'exchanges:reject',
  EXCHANGES_CANCEL = 'exchanges:cancel',
  EXCHANGES_MANAGE_ANY = 'exchanges:manage:any',
  USERS_VIEW = 'users:view',
  USERS_EDIT = 'users:edit',
  USERS_EDIT_ANY = 'users:edit:any',
  USERS_DELETE = 'users:delete',
  USERS_DELETE_ANY = 'users:delete:any',
  ROLES_VIEW = 'roles:view',
  ROLES_MANAGE = 'roles:manage',
  ADMIN_ACCESS = 'admin:access'
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  city: string | null;
  about: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserBasic {
  id: number;
  username: string;
  city: string | null;
  role: UserRole;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string | null;
  genre: string | null;
  condition: string | null;
  cover: string | null;
  cover_url?: string | null;
  owner_id: number;
  owner: UserBasic;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Exchange {
  id: number;
  book_id: number;
  requester_id: number;
  owner_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at?: string;
  book?: Book;
  requester?: User;
  owner?: User;
}

export interface ExchangeResponse extends Exchange {
  book: Book;
  requester: User;
  owner: User;
}