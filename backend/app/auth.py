from . import crud
from sqlmodel import Session
from jose import jwt, JWTError
from .database import get_session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta, timezone

SECRET_KEY = "longndh-goalconnect-login-app-test-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    """
    入力されたパスワードと、保存されているハッシュ化パスワードを照合する

    :param plain_password: str
        ユーザーが入力した平文パスワード
    :param hashed_password: str
        データベースに保存されているハッシュ化済みパスワード
    :return: bool
        一致する場合は True、そうでない場合は False
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    パスワードをハッシュ化する

    :param password: str
        平文パスワード
    :return: str
        ハッシュ化されたパスワード
    """
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """
    JWT アクセストークンを生成する

    :param data: dict
        トークンにエンコードするデータ
    :return: str
        エンコード済み JWT アクセストークン
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
):
    """
    JWT トークンから現在の認証済みユーザーを取得する

    :param token: str
        リクエストヘッダーから取得した JWT トークン
    :param session: Session
        データベースセッション
    :return: User
        トークンに紐づくユーザーオブジェクト
    :raises HTTPException:
        トークンが無効、またはユーザーが存在しない場合
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = crud.get_user_by_username(session, username)
    if user is None:
        raise credentials_exception
    return user