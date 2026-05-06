from app.models import User, UserRole
from app.security import get_password_hash

import pytest


def register_user(client, username: str, email: str | None = None, password: str = "Password123"):
    return client.post(
        "/auth/register",
        json={
            "email": email or f"{username}@example.com",
            "username": username,
            "password": password,
            "full_name": f"{username.title()} User",
            "city": "Moscow",
            "about": "Test user",
        },
    )


def login_user(client, username: str, password: str = "Password123"):
    return client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


@pytest.mark.integration
def test_register_sets_auth_cookies_and_returns_user(client):
    response = register_user(client, "reader")

    assert response.status_code == 200
    assert response.json()["username"] == "reader"
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


@pytest.mark.integration
def test_me_requires_authentication(client):
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Требуется аутентификация"


@pytest.mark.integration
def test_refresh_restores_session_from_refresh_cookie(client):
    register_user(client, "session-user")

    client.cookies.pop("access_token", None)

    refresh_response = client.post("/auth/refresh")
    me_response = client.get("/auth/me")

    assert refresh_response.status_code == 200
    assert refresh_response.json()["username"] == "session-user"
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "session-user"


@pytest.mark.integration
def test_logout_clears_session(client):
    register_user(client, "logout-user")

    logout_response = client.post("/auth/logout")
    me_response = client.get("/auth/me")

    assert logout_response.status_code == 200
    assert me_response.status_code == 401


@pytest.mark.integration
def test_regular_user_cannot_access_admin_user_list(client):
    register_user(client, "member")

    response = client.get("/auth/admin/users")

    assert response.status_code == 403
    assert response.json()["detail"] == "Требуется роль администратора"


@pytest.mark.integration
def test_admin_can_change_user_role(client, db_session):
    admin = User(
        email="admin@example.com",
        username="admin",
        password_hash=get_password_hash("Password123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    target = User(
        email="target@example.com",
        username="target",
        password_hash=get_password_hash("Password123"),
        role=UserRole.USER,
        is_active=True,
    )
    db_session.add_all([admin, target])
    db_session.commit()
    db_session.refresh(target)

    login_response = login_user(client, "admin")
    role_response = client.post(f"/auth/admin/users/{target.id}/role", json={"new_role": "admin"})

    assert login_response.status_code == 200
    assert role_response.status_code == 200
    assert role_response.json()["new_role"] == "admin"
