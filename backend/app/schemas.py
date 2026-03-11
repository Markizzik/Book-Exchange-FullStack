from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from typing import List
from enum import Enum

class UserRole(str, Enum):
    GUEST = "guest"
    USER = "user"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None

class UserUpdateAdmin(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserBasicResponse(BaseModel):
    id: int
    username: str
    city: Optional[str] = None
    role: UserRole
    
    class Config:
        from_attributes = True

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str] = None
    genre: Optional[str] = None
    condition: Optional[str] = None
    cover: Optional[str] = None
    cover_url: Optional[str] = None
    owner_id: int
    owner: 'UserBasicResponse'
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    genre: Optional[str] = None
    condition: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    owner_id: int
    owner: UserBasicResponse 
    cover: Optional[str] = None
    cover_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PaginatedBookResponse(BaseModel):
    books: List[BookResponse]
    total_count: int
    total_pages: int
    current_page: int
    limit: int

class ExchangeBase(BaseModel):
    book_id: int
    requester_id: int
    owner_id: int
    status: Optional[str] = "pending"

class ExchangeCreate(ExchangeBase):
    pass

class ExchangeResponse(ExchangeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    book: BookResponse
    requester: UserResponse
    owner: UserResponse

    class Config:
        from_attributes = True