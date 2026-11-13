import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Determine database path
# If tutor.db does not exist, but cache/tutor_seed.db exists, copy it over or use it
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
SEED_DB_PATH = os.path.join(CACHE_DIR, "tutor_seed.db")
DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tutor.db")

DB_PATH = os.getenv("DATABASE_PATH", DEFAULT_DB_PATH)

# If main DB does not exist yet but seed DB exists, copy seed DB to default DB
if not os.path.exists(DB_PATH) and os.path.exists(SEED_DB_PATH):
    try:
        shutil.copyfile(SEED_DB_PATH, DB_PATH)
    except Exception as e:
        print(f"Warning: Could not copy seed DB: {e}")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that provides an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
