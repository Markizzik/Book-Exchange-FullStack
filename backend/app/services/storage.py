from typing import Iterable

from ..settings import get_settings


def build_cover_url(filename: str | None) -> str | None:
    if not filename:
        return None

    settings = get_settings()
    return f"{settings.minio_public_base_url.rstrip('/')}/{filename.lstrip('/')}"


def attach_cover_url(book):
    if book is None:
        return None

    if getattr(book, "cover", None) and not getattr(book, "cover_url", None):
        book.cover_url = build_cover_url(book.cover)
    return book


def attach_cover_urls(books: Iterable):
    for book in books:
        attach_cover_url(book)
    return books


def attach_exchange_cover_url(exchange):
    if exchange is None:
        return None

    attach_cover_url(getattr(exchange, "book", None))
    return exchange


def attach_exchange_cover_urls(exchanges: Iterable):
    for exchange in exchanges:
        attach_exchange_cover_url(exchange)
    return exchanges
