from sqlmodel import SQLModel, create_engine, Session

SQLITE_FILE_NAME = "database.db"
SQLITE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

# connect_args={"check_same_thread": False} cần thiết cho SQLite
engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """
    Initialize the database and create tables
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Get a new database session
    """
    with Session(engine) as session:
        yield session