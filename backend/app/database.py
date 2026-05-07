from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .settings import get_settings

settings = get_settings()
DATABASE_URL = settings.database_url

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    if "?" in DATABASE_URL:
        DATABASE_URL += "&client_encoding=utf8"
    else:
        DATABASE_URL += "?client_encoding=utf8"

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
