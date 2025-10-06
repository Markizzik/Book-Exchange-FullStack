from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..models import Book, User
from ..schemas import BookResponse, BookCreate
from ..security import get_current_user

router = APIRouter(prefix="/books", tags=["books"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads/covers"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
    if cover:
        file_extension = cover.filename.split(".")[-1]
        cover_filename = f"{datetime.utcnow().timestamp()}.{file_extension}"
        cover_path = os.path.join(UPLOAD_DIR, cover_filename)
        
        with open(cover_path, "wb") as buffer:
            shutil.copyfileobj(cover.file, buffer)
        print(f"Cover saved: {cover_path}")
    
    db_book = Book(
        title=title,
        author=author,
        description=description,
        genre=genre,
        condition=condition,
        cover=cover_filename,
        owner_id=current_user.id
    )
    
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.get("/", response_model=List[BookResponse])
def get_books(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    books = db.query(Book).filter(Book.status == "available").offset(skip).limit(limit).all()
    return books

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
    
    if cover:
        if cover and cover.filename:
            old_cover_path = os.path.join(UPLOAD_DIR, book.cover)
            if os.path.exists(old_cover_path):
                os.remove(old_cover_path)
        
        file_extension = cover.filename.split(".")[-1]
        cover_filename = f"{datetime.utcnow().timestamp()}.{file_extension}"
        cover_path = os.path.join(UPLOAD_DIR, cover_filename)
        
        with open(cover_path, "wb") as buffer:
            shutil.copyfileobj(cover.file, buffer)
        
        book.cover = cover_filename
    
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
        cover_path = os.path.join(UPLOAD_DIR, book.cover)
        if os.path.exists(cover_path):
            os.remove(cover_path)
    
    db.delete(book)
    db.commit()
    return {"message": "Книга успешно удалена"}