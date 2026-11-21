import os
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from app.core.config import settings
except ImportError:
    from core.config import settings

Base = declarative_base()

def get_engine_url() -> str:
    # Priority: settings (which parses .env), then os.environ, then default
    url = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/blinkit_footwear")
    
    # Handle standard Neon / Heroku / Supabase connection strings:
    # Neon strings often start with "postgres://" -> needs "postgresql+psycopg2://" for SQLAlchemy
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    return url

DATABASE_URL = get_engine_url()

# Configure engine with pooling and resilient fallbacks
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "neon.tech" in DATABASE_URL or "sslmode" in DATABASE_URL:
    # Neon requires SSL
    if "sslmode" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args=connect_args
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    # If external PostgreSQL is unreachable during offline/local testing, fallback gracefully to SQLite
    print(f"[Database Warning] Could not connect to {DATABASE_URL}: {e}. Initializing local SQLite fallback for seamless execution.")
    SQLITE_URL = "sqlite:///./footwear_dev.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency that creates an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
