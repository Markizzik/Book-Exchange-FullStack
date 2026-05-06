import pytest

from app.models import Book, Exchange, User, UserRole
from app.security import get_password_hash


def register_user(client, username: str, email: str | None = None, password: str = "Password123"):
    return client.post(
        "/auth/register",
        json={
            "email": email or f"{username}@example.com",
            "username": username,
            "password": password,
            "full_name": f"{username.title()} User",
            "city": "Moscow",
        },
    )


def login_user(client, username: str, password: str = "Password123"):
    return client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def create_book(client, title: str = "Clean Code", author: str = "Robert Martin"):
    return client.post(
        "/books/",
        data={
            "title": title,
            "author": author,
            "description": "Helpful book",
            "genre": "Наука",
            "condition": "good",
        },
    )


@pytest.mark.integration
def test_create_book_requires_authenticated_user(client):
    response = create_book(client)

    assert response.status_code == 401


@pytest.mark.integration
def test_owner_can_update_and_delete_own_book(client):
    register_user(client, "owner")
    create_response = create_book(client, title="Old title")
    book_id = create_response.json()["id"]

    update_response = client.put(
        f"/books/{book_id}",
        data={
            "title": "New title",
            "author": "Robert Martin",
            "description": "Updated description",
            "genre": "Наука",
            "condition": "excellent",
        },
    )
    delete_response = client.delete(f"/books/{book_id}")

    assert create_response.status_code == 200
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "New title"
    assert delete_response.status_code == 200


@pytest.mark.integration
def test_books_endpoint_supports_filters_and_pagination(client, db_session):
    owner = User(
        email="owner@example.com",
        username="owner",
        password_hash=get_password_hash("Password123"),
        role=UserRole.USER,
        is_active=True,
    )
    db_session.add(owner)
    db_session.commit()
    db_session.refresh(owner)

    db_session.add_all(
        [
            Book(
                title="Dune",
                author="Frank Herbert",
                description="Sci-fi classic",
                genre="Фантастика",
                condition="good",
                owner_id=owner.id,
            ),
            Book(
                title="The Hobbit",
                author="J.R.R. Tolkien",
                description="Fantasy story",
                genre="Фэнтези",
                condition="excellent",
                owner_id=owner.id,
            ),
        ]
    )
    db_session.commit()

    response = client.get("/books/", params={"genre": "Фантастика", "search": "Dune", "page": 1, "limit": 1})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_count"] == 1
    assert payload["total_pages"] == 1
    assert payload["books"][0]["title"] == "Dune"


@pytest.mark.integration
def test_owner_cannot_delete_book_with_active_exchange(client, db_session):
    owner = User(
        email="owner@example.com",
        username="owner",
        password_hash=get_password_hash("Password123"),
        role=UserRole.USER,
        is_active=True,
    )
    requester = User(
        email="requester@example.com",
        username="requester",
        password_hash=get_password_hash("Password123"),
        role=UserRole.USER,
        is_active=True,
    )
    db_session.add_all([owner, requester])
    db_session.commit()
    db_session.refresh(owner)
    db_session.refresh(requester)

    book = Book(
        title="Refactoring",
        author="Martin Fowler",
        owner_id=owner.id,
    )
    db_session.add(book)
    db_session.commit()
    db_session.refresh(book)

    exchange = Exchange(
        book_id=book.id,
        requester_id=requester.id,
        owner_id=owner.id,
        status="pending",
    )
    db_session.add(exchange)
    db_session.commit()

    login_user(client, "owner")
    response = client.delete(f"/books/{book.id}")

    assert response.status_code == 400
    assert response.json()["detail"] == "Нельзя удалить книгу с активными обменами"
