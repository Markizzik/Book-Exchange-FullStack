from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from .database import engine, Base
from .routes import auth, books

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Book Exchange API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "covers"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=BASE_DIR / "uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(books.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Book Exchange API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "postgresql"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)