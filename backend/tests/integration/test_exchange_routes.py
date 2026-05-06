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
        },
    )


def login_user(client, username: str, password: str = "Password123"):
    return client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def create_book(client, title: str):
    response = client.post(
        "/books/",
        data={
            "title": title,
            "author": "Author",
            "description": "Description",
            "genre": "Фантастика",
            "condition": "good",
        },
    )
    return response.json()["id"]


@pytest.mark.integration
def test_requester_can_create_and_cancel_exchange(client, fake_socket_manager):
    register_user(client, "owner")
    book_id = create_book(client, "Book for exchange")
    client.post("/auth/logout")

    register_user(client, "requester")
    create_response = client.post(
        "/exchanges/",
        json={"book_id": book_id, "requester_id": 0, "owner_id": 0},
    )
    exchange_id = create_response.json()["id"]
    cancel_response = client.delete(f"/exchanges/{exchange_id}/cancel")

    assert create_response.status_code == 200
    assert cancel_response.status_code == 200
    assert fake_socket_manager.new_exchange_calls == [exchange_id]


@pytest.mark.integration
def test_owner_can_accept_exchange_and_book_becomes_exchanged(client, fake_socket_manager):
    register_user(client, "owner")
    book_id = create_book(client, "Domain-Driven Design")
    client.post("/auth/logout")

    register_user(client, "requester")
    create_response = client.post(
        "/exchanges/",
        json={"book_id": book_id, "requester_id": 0, "owner_id": 0},
    )
    exchange_id = create_response.json()["id"]
    client.post("/auth/logout")

    login_user(client, "owner")
    accept_response = client.put(f"/exchanges/{exchange_id}/accept")
    book_response = client.get(f"/books/{book_id}")

    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "accepted"
    assert book_response.json()["status"] == "exchanged"
    assert fake_socket_manager.status_updates == [(exchange_id, "accepted")]


@pytest.mark.integration
def test_user_cannot_exchange_own_book(client):
    register_user(client, "owner")
    book_id = create_book(client, "Self owned")

    response = client.post(
        "/exchanges/",
        json={"book_id": book_id, "requester_id": 0, "owner_id": 0},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Вы не можете обменять свою же книгу"
