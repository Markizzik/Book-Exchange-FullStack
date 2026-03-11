from sqlalchemy.orm import Session
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.security import get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if existing_admin:
        print(f"⚠️  Администратор уже существует: {existing_admin.username}")
        print(f"   Email: {existing_admin.email}")
    else:
        admin = User(
            email="admin@example.com",
            username="admin",
            password_hash=get_password_hash("admin123"),
            full_name="Administrator",
            city="Moscow",
            about="Системный администратор платформы Book Exchange",
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Администратор успешно создан!")
        print("=" * 50)
        print("📧 Email: admin@example.com")
        print("👤 Username: admin")
        print("🔑 Пароль: admin123")
        print("=" * 50)
        print("⚠️  Обязательно смените пароль после первого входа!")
        
finally:
    db.close()