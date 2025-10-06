from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .database import engine, Base
from .routes import auth, books

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Book Exchange API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/covers", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from app.routes import auth, books
from app.database import engine, Base

# Подключаем роуты
app.include_router(auth.router)
app.include_router(books.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Book Exchange API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)