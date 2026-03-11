from enum import Enum
from typing import List, Dict, Set
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, UserRole
from .security import get_current_user

class Permission(str, Enum):
    BOOKS_VIEW = "books:view"
    BOOKS_CREATE = "books:create"
    BOOKS_EDIT = "books:edit"
    BOOKS_DELETE = "books:delete"
    BOOKS_EDIT_ANY = "books:edit:any"
    BOOKS_DELETE_ANY = "books:delete:any"
    
    EXCHANGES_VIEW = "exchanges:view"
    EXCHANGES_CREATE = "exchanges:create"
    EXCHANGES_ACCEPT = "exchanges:accept"
    EXCHANGES_REJECT = "exchanges:reject"
    EXCHANGES_CANCEL = "exchanges:cancel"
    EXCHANGES_MANAGE_ANY = "exchanges:manage:any"
    
    USERS_VIEW = "users:view"
    USERS_EDIT = "users:edit"
    USERS_EDIT_ANY = "users:edit:any"
    USERS_DELETE = "users:delete"
    USERS_DELETE_ANY = "users:delete:any"
    
    ROLES_VIEW = "roles:view"
    ROLES_MANAGE = "roles:manage"
    ADMIN_ACCESS = "admin:access"

# Матрица ролей и разрешений
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    "guest": {
        Permission.BOOKS_VIEW,
        Permission.EXCHANGES_VIEW,
        Permission.USERS_VIEW,
    },
    "user": {
        Permission.BOOKS_VIEW,
        Permission.BOOKS_CREATE,
        Permission.BOOKS_EDIT,
        Permission.BOOKS_DELETE,
        Permission.EXCHANGES_VIEW,
        Permission.EXCHANGES_CREATE,
        Permission.EXCHANGES_ACCEPT,
        Permission.EXCHANGES_REJECT,
        Permission.EXCHANGES_CANCEL,
        Permission.USERS_VIEW,
        Permission.USERS_EDIT,
    },
    "admin": {
        Permission.BOOKS_VIEW,
        Permission.BOOKS_CREATE,
        Permission.BOOKS_EDIT,
        Permission.BOOKS_DELETE,
        Permission.BOOKS_EDIT_ANY,
        Permission.BOOKS_DELETE_ANY,
        Permission.EXCHANGES_VIEW,
        Permission.EXCHANGES_CREATE,
        Permission.EXCHANGES_ACCEPT,
        Permission.EXCHANGES_REJECT,
        Permission.EXCHANGES_CANCEL,
        Permission.EXCHANGES_MANAGE_ANY,
        Permission.USERS_VIEW,
        Permission.USERS_EDIT,
        Permission.USERS_EDIT_ANY,
        Permission.USERS_DELETE,
        Permission.USERS_DELETE_ANY,
        Permission.ROLES_VIEW,
        Permission.ROLES_MANAGE,
        Permission.ADMIN_ACCESS,
    }
}

def get_user_permissions(user: User) -> Set[Permission]:
    """Получить все разрешения для пользователя на основе его роли"""
    return ROLE_PERMISSIONS.get(user.role.value, set())

def has_permission(user: User, permission: Permission) -> bool:
    """Проверить, есть ли у пользователя конкретное разрешение"""
    user_permissions = get_user_permissions(user)
    return permission in user_permissions

def require_permission(permission: Permission):
    """Decorator/Dependency для проверки разрешения на endpoint"""
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется разрешение: {permission.value}"
            )
        return current_user
    return permission_checker

def require_role(required_role: str):
    """Dependency для проверки роли пользователя"""
    async def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if current_user.role.value != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Требуется роль: {required_role}. Ваша роль: {current_user.role.value}"
            )
        return current_user
    return role_checker

def require_admin():
    """Dependency для проверки администраторских прав"""
    return require_role("admin")

def can_edit_book(user: User, book_owner_id: int) -> bool:
    """Проверить, может ли пользователь редактировать книгу"""
    if user.role.value == UserRole.ADMIN:
        return True
    if user.role.value == UserRole.ADMIN and user.id == book_owner_id:
        return True
    return False

def can_delete_book(user: User, book_owner_id: int, has_exchanges: bool = False) -> bool:
    """Проверить, может ли пользователь удалить книгу"""
    if user.role.value == UserRole.ADMIN:
        return True
    if user.role.value == UserRole.ADMIN and user.id == book_owner_id:
        # Пользователь не может удалить книгу, если есть активные обмены
        if has_exchanges:
            return False
        return True
    return False