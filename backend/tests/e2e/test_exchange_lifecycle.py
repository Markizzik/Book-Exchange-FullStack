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


@pytest.mark.e2e
def test_full_exchange_lifecycle(client):
    owner_register = register_user(client, "owner")
    owner_me = client.get("/auth/me")
    owner_id = owner_me.json()["id"]
    create_book = client.post(
        "/books/",
        data={
            "title": "Pragmatic Programmer",
            "author": "Andy Hunt",
            "description": "Classic book",
            "genre": "Наука",
            "condition": "good",
        },
    )
    book_id = create_book.json()["id"]
    client.post("/auth/logout")

    requester_register = register_user(client, "requester")
    requester_me = client.get("/auth/me")
    requester_id = requester_me.json()["id"]
    create_exchange = client.post(
        "/exchanges/",
        json={
            "book_id": book_id,
            "requester_id": requester_id,
            "owner_id": owner_id,
        },
    )
    exchange_id = create_exchange.json()["id"]
    requests_response = client.get("/exchanges/my-requests")
    client.post("/auth/logout")

    client.post(
        "/auth/login",
        data={"username": "owner", "password": "Password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    offers_response = client.get("/exchanges/my-offers")
    accept_response = client.put(f"/exchanges/{exchange_id}/accept")
    book_response = client.get(f"/books/{book_id}")

    assert owner_register.status_code == 200
    assert requester_register.status_code == 200
    assert create_book.status_code == 200
    assert create_exchange.status_code == 200
    assert requests_response.status_code == 200
    assert len(requests_response.json()) == 1
    assert offers_response.status_code == 200
    assert len(offers_response.json()) == 1
    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "accepted"
    assert book_response.json()["status"] == "exchanged"
