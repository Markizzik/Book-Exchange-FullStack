from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Book
from ..models import User, UserRole
from ..permissions import get_user_permissions
from ..schemas import BookResponse, UserCreate, UserResponse, UserUpdateAdmin
from ..security import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, create_access_token, create_refresh_token, get_current_admin_user, get_current_user, get_current_user_from_refresh, get_password_hash, verify_password
from ..services.storage import attach_cover_urls
from ..settings import get_settings

router = APIRouter(prefix="/auth", tags=["authentication"])

settings = get_settings()
COOKIE_SECURE = settings.cookie_secure
COOKIE_SAMESITE = settings.cookie_samesite

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Установить httpOnly cookies"""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

def clear_auth_cookies(response: Response):
    """Очистить cookies"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

@router.post("/register", response_model=UserResponse)
def register(response: Response, user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Почта уже зарегистрирована"
        )
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя пользователя уже занято"
        )
    
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        city=user_data.city,
        about=user_data.about,
        role=UserRole.USER
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": db_user.username, "user_id": db_user.id}
    )
    set_auth_cookies(response, access_token, refresh_token)
    return db_user

@router.post("/login", response_model=UserResponse)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"🔐 Login attempt for user: {form_data.username}")
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        print(f"❌ Invalid credentials for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильно введено имя пользователя или пароль"
        )
    
    if not user.is_active:
        print(f"❌ User inactive: {form_data.username}") 
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь деактивирован"
        )

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role.value}
    )
    print(f"🍪 Setting cookies...")  # ← Добавьте это
    set_auth_cookies(response, access_token, refresh_token)
    print(f"🍪 Response headers after set: {dict(response.headers)}")  # ← Добавьте это
    print(f"✅ Login successful for: {user.username}")  # ← Добавьте это
    
    return user

@router.post("/refresh", response_model=UserResponse)
def refresh_token(response: Response, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_refresh)):
    """Обновить access token используя refresh token"""
    
    access_token = create_access_token(
        data={"sub": current_user.username, "user_id": current_user.id, "role": current_user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": current_user.username, "user_id": current_user.id, "role": current_user.role.value}
    )
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return current_user

@router.post("/logout")
def logout(response: Response):
    """Выйти из системы (очистить cookies)"""
    clear_auth_cookies(response)
    return {"message": "Успешный выход"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(request: Request, current_user: User = Depends(get_current_user)):
    """Получить данные текущего пользователя"""
    return current_user

@router.get("/profile/{user_id}", response_model=UserResponse)
def get_user_profile(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/profile/{user_id}/books", response_model=List[BookResponse])
def get_user_books(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    books = db.query(Book).filter(Book.owner_id == user_id, Book.status == "available").options(joinedload(Book.owner)).all()
    attach_cover_urls(books)
    return books

@router.get("/me/permissions", response_model=List[str])
def get_my_permissions(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Получить список разрешений текущего пользователя"""
    permissions = get_user_permissions(current_user)
    return [p.value for p in permissions]

@router.get("/admin/users", response_model=List[UserResponse])
def get_all_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Получить список всех пользователей (только для администраторов)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.put("/admin/users/{user_id}", response_model=UserResponse)
def update_user(
    request: Request,
    user_id: int,
    user_data: UserUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Обновить данные пользователя (только для администраторов)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Нельзя редактировать самого себя через админ-панель"
        )
    
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "role" and value:
            if value != UserRole.ADMIN and user.role == UserRole.ADMIN:
                admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
                if admin_count <= 1:
                    raise HTTPException(
                        status_code=400,
                        detail="Нельзя понизить роль последнего администратора"
                    )
        if field == "is_active" and value == False:
            if user_id == current_user.id:
                raise HTTPException(
                    status_code=400,
                    detail="Нельзя деактивировать самого себя"
                )

        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/admin/users/{user_id}")
def delete_user(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Удалить пользователя (только для администраторов)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить самого себя"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.role == UserRole.ADMIN:
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Нельзя удалить последнего администратора"
            )
    
    db.delete(user)
    db.commit()
    return {"message": "Пользователь успешно удален"}

@router.post("/admin/users/{user_id}/role")
def update_user_role(
    request: Request,
    user_id: int,
    new_role: UserRole = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Изменить роль пользователя (только для администраторов)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Нельзя изменить свою собственную роль"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Нельзя понизить роль последнего администратора"
            )
    
    user.role = new_role
    db.commit()
    db.refresh(user)

    return {
        "message": f"Роль пользователя изменена на {new_role.value}",
        "user_id": user_id,
        "new_role": new_role.value
    }
