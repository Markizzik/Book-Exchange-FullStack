from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session
from sqlalchemy import or_
from math import ceil
import shutil
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..models import Book, User
from ..schemas import BookResponse, BookCreate, PaginatedBookResponse
from ..security import get_current_user
from ..minio_client import minio_client  # Добавляем импорт MinIO клиента

router = APIRouter(prefix="/books", tags=["books"])




@router.post("/", response_model=BookResponse)
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    cover: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cover_filename = None
    cover_url = None

    if cover:
        file_extension = cover.filename.split(".")[-1] if "." in cover.filename else "jpg"
        cover_filename = f"{datetime.utcnow().timestamp()}.{file_extension}"
        try:
            # Сохраняем файл во временный буфер
            cover.file.seek(0)
            cover_url = minio_client.upload_cover(cover.file, cover_filename)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка загрузки обложки: {str(e)}"
            )
    
    db_book = Book(
        title=title,
        author=author,
        description=description,
        genre=genre,
        condition=condition,
        cover=cover_filename,
        cover_url=cover_url,  # Сохраняем URL из MinIO
        owner_id=current_user.id
    )
    
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.get("/", response_model=PaginatedBookResponse)
def get_books(
    page: int = 1,
    limit: int = 10,
    genre: Optional[str] = None,
    condition: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Book).filter(Book.status == "available")
    
    # Применяем фильтры
    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))
    if condition:
        query = query.filter(Book.condition == condition)
    if search:
        query = query.filter(
            or_(
                Book.title.ilike(f"%{search}%"),
                Book.author.ilike(f"%{search}%"),
                Book.description.ilike(f"%{search}%")
            )
        )
    
    # Получаем общее количество
    total_count = query.count()
    
    # Вычисляем смещение
    skip = (page - 1) * limit
    
    # Получаем книги с загруженными владельцами
    books = query.options(joinedload(Book.owner)).offset(skip).limit(limit).all()
    
    for book in books:
        if book.cover and not book.cover_url:
            # Если URL не сохранен в базе, генерируем его из MinIO
            protocol = "https" if minio_client.secure else "http"
            host = minio_client.endpoint_url.split("://")[1]
            book.cover_url = f"{protocol}://{host}/{minio_client.bucket_name}/{book.cover}"
    
    # Вычисляем общее количество страниц
    total_pages = ceil(total_count / limit) if limit > 0 else 1
    
    return {
        "books": books,
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit
    }

@router.get("/my-books", response_model=List[BookResponse])
def get_my_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    books = db.query(Book).filter(Book.owner_id == current_user.id).all()
    return books

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    return book

@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    title: str = Form(...),
    author: str = Form(...),
    description: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    cover: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Не достаточно прав")
    
    book.title = title
    book.author = author
    book.description = description
    book.genre = genre
    book.condition = condition
    
    if cover and cover.filename:
        # Удаляем старую обложку из MinIO, если она существует
        if book.cover:
            try:
                minio_client.delete_cover(book.cover)
            except Exception as e:
                print(f"Ошибка удаления старой обложки: {str(e)}")
        
        # Загружаем новую обложку в MinIO
        try:
            file_extension = cover.filename.split(".")[-1] if "." in cover.filename else "jpg"
            cover_filename = f"{datetime.utcnow().timestamp()}.{file_extension}"
            cover.file.seek(0)
            cover_url = minio_client.upload_cover(cover.file, cover_filename)
            
            book.cover = cover_filename
            book.cover_url = cover_url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка загрузки новой обложки: {str(e)}"
            )
    
    db.commit()
    db.refresh(book)
    return book

@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Не достаточно прав")
    
    if book.cover:
        try:
            minio_client.delete_cover(book.cover)
        except Exception as e:
            print(f"Ошибка удаления обложки: {str(e)}")
    
    db.delete(book)
    db.commit()
    return {"message": "Книга успешно удалена"}