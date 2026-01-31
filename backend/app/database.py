from sqlmodel import SQLModel, create_engine, Session

SQLITE_FILE_NAME = "database.db"
SQLITE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """
    データベースを初期化し、定義されている全テーブルを作成する
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    新しいデータベースセッションを取得する

    FastAPI の Depends として使用し、
    リクエストごとにセッションを提供する
    """
    with Session(engine) as session:
        yield session