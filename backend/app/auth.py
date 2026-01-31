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
    Verify password
    
    :param plain_password - str: user's input password
    :param hashed_password - str: db stored hashed password
    :return: True if match, else False
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Hash password

    :param password - str: plain password
    :return: hashed password
    """
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """
    Create JWT access token

    :param data - dict: data to encode in the token
    :return: encoded JWT token
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Hàm phụ trợ: Lấy user hiện tại từ Token (Dùng để bảo vệ API)
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    """
    Get current user from JWT token
    
    :param token - str: JWT token from request
    :param session - Session: DB session
    :return: User which token belongs to
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