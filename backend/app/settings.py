import os
from functools import lru_cache
from typing import Literal

from dotenv import load_dotenv

load_dotenv()


def _split_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _normalize_url(value: str | None, default: str) -> str:
    normalized = (value or default).strip().rstrip("/")
    return normalized or default


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    app_host: str = os.getenv("APP_HOST", "0.0.0.0")
    app_port: int = int(os.getenv("APP_PORT", "8000"))

    secret_key: str = os.getenv("SECRET_KEY", "")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    cookie_secure: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    cookie_samesite: Literal["lax", "strict", "none"] = os.getenv("COOKIE_SAMESITE", "lax").lower()  # type: ignore[assignment]

    public_site_url: str = _normalize_url(os.getenv("PUBLIC_SITE_URL"), "http://localhost:3000")
    allowed_origins: list[str] = _split_csv(
        os.getenv("ALLOWED_ORIGINS"),
        ["http://localhost:3000", "http://127.0.0.1:3000"],
    )

    database_url: str = os.getenv("DATABASE_URL", "")

    minio_endpoint: str = _normalize_url(os.getenv("MINIO_ENDPOINT"), "http://localhost:9000")
    minio_public_base_url: str = _normalize_url(
        os.getenv("MINIO_PUBLIC_BASE_URL"),
        f"{minio_endpoint}/{os.getenv('MINIO_BUCKET_NAME', 'book-covers')}",
    )
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    minio_bucket_name: str = os.getenv("MINIO_BUCKET_NAME", "book-covers")
    minio_secure: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

    openweather_api_key: str | None = os.getenv("OPENWEATHER_API_KEY")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.secret_key:
        raise ValueError("SECRET_KEY не задан в переменных окружения")
    if not settings.database_url:
        raise ValueError("DATABASE_URL не задан в переменных окружения")
    return settings
