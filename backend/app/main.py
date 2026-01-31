import random
import uvicorn

from sqlmodel import Session
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler

from . import crud, auth
from .utils import validate_password_strength
from .models import UserPublic, UserCreate, OTP, OTPRequest, User
from .database import create_db_and_tables, get_session, engine

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import FastAPI, Depends, HTTPException, status, Form, Request

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI アプリケーションのライフサイクル管理

    アプリ起動時にデータベース初期化および
    デフォルト管理者ユーザーの作成を行う
    """
    create_db_and_tables()
    crud.create_default_admin(session=Session(engine))
    yield

app = FastAPI(lifespan=lifespan)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === API INDEX ===
@app.get("/")
def index():
    return {"message": "ログインシステム API へようこそ"}

# === API SEND OTP ===
@app.post("/send-otp")
@limiter.limit("5/minute")
def send_otp(
    request: Request,
    req: OTPRequest,
    session: Session = Depends(get_session)
):
    """
    登録またはログイン用の OTP を発行する
    """
    user = crud.get_user_by_username(session, req.username)
    print("OTPリクエスト受信:", req.username, "種別:", req.type)

    # --- 登録フロー ---
    if req.type == "register":
        if user:
            raise HTTPException(
                status_code=400,
                detail="このユーザー名は既に存在します"
            )

    # --- ログインフロー ---
    elif req.type == "login":
        if not req.password:
            raise HTTPException(
                status_code=400,
                detail="ログインにはパスワードが必要です"
            )

        if not user or not auth.verify_password(req.password, user.password):
            raise HTTPException(
                status_code=400,
                detail="ユーザー名またはパスワードが正しくありません"
            )

    # --- OTP 作成 ---
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=1)

    # 既存 OTP を無効化
    existing_otp = session.get(OTP, req.username)
    if existing_otp:
        session.delete(existing_otp)
        session.commit()

    new_otp = OTP(username=req.username, code=otp_code, expires_at=expires_at)
    session.add(new_otp)
    session.commit()

    # --- OTP 送信（シミュレーション） ---
    if req.email or (user and user.email):
        print("\n[疑似メールサーバー]")
        print(f"宛先: {req.email or user.email}")
        print("件名: 認証コードのお知らせ")
        print(f"本文: OTPコードは {otp_code} です\n")

        return {
            "message": "OTPをメールに送信しました",
            "otp_code": None
        }
    else:
        return {
            "message": "OTPを画面に表示しました",
            "otp_code": otp_code
        }

# === API REGISTER ===
@app.post("/register", response_model=UserPublic)
@limiter.limit("5/minute")
def register(
    request: Request,
    user_in: UserCreate,
    session: Session = Depends(get_session)
):
    """
    新規ユーザー登録
    """
    if user_in.password:
        validate_password_strength(user_in.password)
    else:
        raise HTTPException(
            status_code=400,
            detail="パスワードは必須です"
        )

    crud.verify_otp(session, user_in.username, user_in.otp)

    user = crud.get_user_by_username(session, user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="このユーザー名は既に登録されています"
        )

    print("ユーザー作成:", user_in.username)
    new_user = crud.create_user(session, user_in)
    return new_user

# === API LOGIN ===
@app.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    otp: str = Form(...),
    session: Session = Depends(get_session)
):
    """
    ログイン処理（パスワード + OTP 認証）
    """
    user = crud.get_user_by_username(session, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー名またはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    crud.verify_otp(session, form_data.username, otp)

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# === API REFRESH TOKEN ===
@app.post("/refresh-token")
def refresh_token(current_user: User = Depends(auth.get_current_user)):
    """
    現在のユーザーに対して JWT アクセストークンを再発行する
    """
    access_token = auth.create_access_token(data={"sub": current_user.username})
    return {"access_token": access_token, "token_type": "bearer"}