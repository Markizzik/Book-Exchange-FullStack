import asyncio
from datetime import datetime
from math import ceil
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..minio_client import minio_client
from ..models import Book, Exchange, User, UserRole
from ..permissions import Permission, can_delete_book, can_edit_book, has_permission
from ..schemas import BookResponse, PaginatedBookResponse
from ..security import get_current_user
from ..services.storage import attach_cover_url, attach_cover_urls
from ..services.weather import get_city_weather

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
    current_user: User = Depends(get_current_user),
):
    if not has_permission(current_user, Permission.BOOKS_CREATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания книги",
        )

    cover_filename = None
    cover_url = None

    if cover:
        file_extension = cover.filename.split(".")[-1] if "." in cover.filename else "jpg"
        cover_filename = f"{datetime.utcnow().timestamp()}.{file_extension}"
        try:
            cover.file.seek(0)
            cover_url = minio_client.upload_cover(cover.file, cover_filename)
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка загрузки обложки: {str(error)}",
            )

    db_book = Book(
        title=title,
        author=author,
        description=description,
        genre=genre,
        condition=condition,
        cover=cover_filename,
        cover_url=cover_url,
        owner_id=current_user.id,
    )

    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    attach_cover_url(db_book)
    return db_book


@router.get("/", response_model=PaginatedBookResponse)
def get_books(
    page: int = 1,
    limit: int = 10,
    genre: Optional[str] = None,
    condition: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Book).filter(Book.status == "available")

    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))
    if condition:
        query = query.filter(Book.condition == condition)
    if search:
        query = query.filter(
            or_(
                Book.title.ilike(f"%{search}%"),
                Book.author.ilike(f"%{search}%"),
                Book.description.ilike(f"%{search}%"),
            )
        )

    total_count = query.count()
    skip = (page - 1) * limit

    books = query.options(joinedload(Book.owner)).offset(skip).limit(limit).all()
    attach_cover_urls(books)

    total_pages = ceil(total_count / limit) if limit > 0 else 1

    return {
        "books": books,
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit,
    }


@router.get("/my-books", response_model=List[BookResponse])
def get_my_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    books = db.query(Book).filter(Book.owner_id == current_user.id).all()
    attach_cover_urls(books)
    return books


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    attach_cover_url(book)
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
    current_user: User = Depends(get_current_user),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    if not can_edit_book(current_user, book.owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этой книги",
        )

    book.title = title
    book.author = author
    book.description = description
    book.genre = genre
    book.condition = condition

    if cover and cover.filename:
        if book.cover:
            try:
                minio_client.delete_cover(book.cover)
            except Exception as error:
                print(f"Ошибка удаления старой обложки: {str(error)}")

        try:
            file_extension = cover.filename.split(".")[-1] if "." in cover.filename else "jpg"
            cover_filename = f"{datetime.utcnow().timestamp()}.{file_extension}"
            cover.file.seek(0)
            cover_url = minio_client.upload_cover(cover.file, cover_filename)

            book.cover = cover_filename
            book.cover_url = cover_url
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка загрузки новой обложки: {str(error)}",
            )

    db.commit()
    db.refresh(book)
    attach_cover_url(book)
    return book


@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    has_active_exchanges = (
        db.query(Exchange)
        .filter(Exchange.book_id == book_id, Exchange.status.in_(["pending", "accepted"]))
        .count()
        > 0
    )

    if not can_delete_book(current_user, book.owner_id, has_active_exchanges):
        if has_active_exchanges:
            raise HTTPException(
                status_code=400,
                detail="Нельзя удалить книгу с активными обменами",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этой книги",
        )

    if book.cover:
        try:
            minio_client.delete_cover(book.cover)
        except Exception as error:
            print(f"Ошибка удаления обложки: {str(error)}")

    db.delete(book)
    db.commit()
    return {"message": "Книга успешно удалена"}


@router.get("/admin/all-books", response_model=PaginatedBookResponse)
def get_all_books_admin(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуется роль администратора",
        )

    query = db.query(Book)
    total_count = query.count()
    skip = (page - 1) * limit
    books = query.options(joinedload(Book.owner)).offset(skip).limit(limit).all()
    attach_cover_urls(books)
    total_pages = ceil(total_count / limit) if limit > 0 else 1

    return {
        "books": books,
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit,
    }


@router.get("/admin/user/{user_id}/books", response_model=List[BookResponse])
def get_user_books_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуется роль администратора",
        )

    books = db.query(Book).filter(Book.owner_id == user_id).all()
    attach_cover_urls(books)
    return books


@router.get("/weather/city")
async def get_weather_by_city(city: str = Query(..., min_length=1, max_length=100)):
    loop = asyncio.get_running_loop()
    weather_data = await loop.run_in_executor(None, lambda: get_city_weather(city))

    if not weather_data:
        raise HTTPException(
            status_code=404,
            detail=f"Не удалось получить погоду для города '{city}'",
        )

    return weather_data
