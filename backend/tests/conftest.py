import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TEST_DB_PATH = Path(__file__).with_name("lab5_test.sqlite3")

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ.setdefault("SECRET_KEY", "lab5-test-secret")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("MINIO_ENDPOINT", "http://localhost:9000")
os.environ.setdefault("MINIO_ACCESS_KEY", "minioadmin")
os.environ.setdefault("MINIO_SECRET_KEY", "minioadmin")
os.environ.setdefault("MINIO_BUCKET_NAME", "book-covers")
os.environ.setdefault("MINIO_SECURE", "false")

from app.database import Base, SessionLocal, engine, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.routes import books as books_routes  # noqa: E402


class FakeMinioClient:
    endpoint_url = "http://minio.test"
    bucket_name = "book-covers"
    secure = False

    def __init__(self):
        self.uploaded_files: list[str] = []
        self.deleted_files: list[str] = []

    def upload_cover(self, file, filename: str) -> str:
        file.read()
        self.uploaded_files.append(filename)
        return f"http://minio.test/{self.bucket_name}/{filename}"

    def delete_cover(self, filename: str) -> bool:
        self.deleted_files.append(filename)
        return True


class FakeSocketManager:
    def __init__(self):
        self.online_users: dict[str, set[str]] = {}
        self.new_exchange_calls: list[int] = []
        self.status_updates: list[tuple[int, str]] = []

    async def notify_new_exchange(self, exchange_id: int):
        self.new_exchange_calls.append(exchange_id)

    async def notify_exchange_status_update(self, exchange_id: int, status: str):
        self.status_updates.append((exchange_id, status))


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def fake_minio(monkeypatch: pytest.MonkeyPatch) -> FakeMinioClient:
    client = FakeMinioClient()
    monkeypatch.setattr(books_routes, "minio_client", client)
    return client


@pytest.fixture
def fake_socket_manager() -> FakeSocketManager:
    manager = FakeSocketManager()
    app.state.socket_manager = manager
    return manager


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(fake_minio: FakeMinioClient, fake_socket_manager: FakeSocketManager):
    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
