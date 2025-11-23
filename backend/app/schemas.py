from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from typing import List

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
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserBasicResponse(BaseModel):
    id: int
    username: str
    city: Optional[str] = None
    
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
    owner: UserBasicResponse  # Добавляем владельца
    cover: Optional[str] = None
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