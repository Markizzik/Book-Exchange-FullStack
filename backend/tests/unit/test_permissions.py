import pytest

from app.models import User, UserRole
from app.permissions import Permission, can_delete_book, can_edit_book, get_user_permissions, has_permission


def make_user(role: UserRole, user_id: int = 1) -> User:
    return User(
        id=user_id,
        email=f"{role.value}{user_id}@example.com",
        username=f"{role.value}{user_id}",
        password_hash="hash",
        role=role,
        is_active=True,
    )


@pytest.mark.unit
def test_guest_has_only_public_permissions():
    guest = make_user(UserRole.GUEST)

    permissions = get_user_permissions(guest)

    assert Permission.BOOKS_VIEW in permissions
    assert Permission.BOOKS_CREATE not in permissions
    assert Permission.ROLES_MANAGE not in permissions


@pytest.mark.unit
def test_owner_can_edit_and_delete_own_book_without_active_exchange():
    user = make_user(UserRole.USER, user_id=42)

    assert has_permission(user, Permission.BOOKS_EDIT)
    assert has_permission(user, Permission.BOOKS_DELETE)
    assert can_edit_book(user, book_owner_id=42) is True
    assert can_delete_book(user, book_owner_id=42, has_exchanges=False) is True


@pytest.mark.unit
def test_owner_cannot_delete_book_with_active_exchange():
    user = make_user(UserRole.USER, user_id=42)

    assert can_delete_book(user, book_owner_id=42, has_exchanges=True) is False


@pytest.mark.unit
def test_admin_can_manage_any_book():
    admin = make_user(UserRole.ADMIN, user_id=7)

    assert can_edit_book(admin, book_owner_id=999) is True
    assert can_delete_book(admin, book_owner_id=999, has_exchanges=True) is True
