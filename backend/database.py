from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker

from models import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./linkoteca.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(db_connection, _):
    cursor = db_connection.cursor()

    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.execute("PRAGMA cache_size=-4096")          # 4 MB
    cursor.execute("PRAGMA mmap_size=268435456")       # 256 MB
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_size_limit=67108864")

    cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def init_db():
    """Initializes the database by creating all defined tables."""
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        conn.execute(text("PRAGMA optimize"))

def get_db():
    """Yields a database session and ensures it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()