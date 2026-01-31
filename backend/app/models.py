import uuid
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone


class UserBase(SQLModel):
    """
    ユーザーの基本モデル

    :param username: str
        一意なユーザー名
    :param email: Optional[str]
        ユーザーのメールアドレス（任意）
    :param role: str
        ユーザー権限（デフォルト: "user"）
    """
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None)
    role: str = Field(default="user")


class User(UserBase, table=True):
    """
    ユーザーデータベースモデル

    :param id: Optional[int]
        主キー
    :param gid: uuid.UUID
        グローバル一意識別子
    :param password: str
        ハッシュ化されたパスワード
    :param created_at: datetime
        アカウント作成日時
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    gid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        index=True,
        unique=True,
        nullable=False
    )
    password: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class OTP(SQLModel, table=True):
    """
    OTP（ワンタイムパスワード）データベースモデル

    :param username: str
        紐づくユーザー名（主キー）
    :param code: str
        OTP コード
    :param expires_at: datetime
        OTP の有効期限
    """
    # 各ユーザーにつき、有効な OTP は常に 1 件のみ
    username: str = Field(primary_key=True)
    code: str
    expires_at: datetime

class UserCreate(UserBase):
    """
    ユーザー登録用リクエストモデル

    :param password: str
        平文パスワード
    :param otp: str
        認証用 OTP コード
    """
    password: str
    otp: str

class UserPublic(UserBase):
    """
    公開用ユーザーモデル（レスポンス用）

    :param gid: uuid.UUID
        グローバル一意識別子
    :param created_at: datetime
        アカウント作成日時
    """
    gid: uuid.UUID
    created_at: datetime

class OTPRequest(BaseModel):
    """
    OTP 発行リクエストモデル

    :param username: str
        OTP を要求するユーザー名
    :param password: str | None
        ログイン時に使用するパスワード（任意）
    :param email: str | None
        OTP 送信用メールアドレス（任意）
    :param type: str
        リクエスト種別（"register" または "login"）
    """
    username: str
    password: str | None = None
    email: str | None = None
    type: str = "register"