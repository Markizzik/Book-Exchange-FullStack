from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from fastapi.responses import Response
import xml.etree.ElementTree as ET
from .database import engine, Base
from .routes import auth, books, exchanges
from .websockets import SocketManager  # Импортируем SocketManager
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При запуске приложения
    print("🚀 Запуск приложения...")
    print("🔌 Инициализация вебсокет-сервера...")
    
    # Создаем таблицы
    print("📊 Создание таблиц в базе данных...")
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # При остановке приложения
    print("🛑 Остановка приложения...")
    if hasattr(socket_manager, 'sio'):
        print("🔌 Остановка вебсокет-сервера...")
        await socket_manager.sio.eio.shutdown()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Book Exchange API", version="1.0.0", lifespan=lifespan)

socket_manager = SocketManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.state.socket_manager = socket_manager

app.mount("/ws", socket_manager.app)


app.include_router(auth.router)
app.include_router(books.router)
app.include_router(exchanges.router)

@app.get("/robots.txt")
async def robots_txt():
    content = """
User-agent: *
Allow: /
Allow: /catalog
Allow: /book/
Disallow: /auth/
Disallow: /admin/
Disallow: /profile/
Disallow: /add-book
Disallow: /edit-book

Sitemap: http://localhost:3000/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")

@app.get("/sitemap.xml")
async def sitemap():
    # Простая реализация: берем все доступные книги
    # В реальном проекте лучше использовать кэширование
    from .database import SessionLocal
    from .models import Book
    
    db = SessionLocal()
    try:
        books = db.query(Book).filter(Book.status == "available").all()
        
        urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
        
        # Статические страницы
        for path in ["", "/catalog"]:
            url = ET.SubElement(urlset, "url")
            loc = ET.SubElement(url, "loc")
            loc.text = f"http://localhost:3000{path}"
            priority = ET.SubElement(url, "priority")
            priority.text = "1.0" if path == "" else "0.9"

        # Динамические страницы книг
        for book in books:
            url = ET.SubElement(urlset, "url")
            loc = ET.SubElement(url, "loc")
            loc.text = f"http://localhost:3000/book/{book.id}"
            lastmod = ET.SubElement(url, "lastmod")
            lastmod.text = book.updated_at.isoformat() if book.updated_at else book.created_at.isoformat()
            priority = ET.SubElement(url, "priority")
            priority.text = "0.8"

        return Response(content=ET.tostring(urlset, encoding="unicode"), media_type="application/xml")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Book Exchange API"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "postgresql",
        "websockets": "enabled",
        "online_users": len(socket_manager.online_users)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)