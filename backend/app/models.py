import uuid
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class UserBase(SQLModel):
    """
    User Base Model

    :param username - str: unique username
    :param email - Optional[str]: user's email
    :param role - str: user role (default "user")
    """
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None)
    role: str = Field(default="user")

class User(UserBase, table=True):
    """
    User Database Model

    :param id - Optional[int]: primary key
    :param gid - uuid.UUID: global unique identifier
    :param password - str: hashed password
    :param created_at - datetime: account creation timestamp
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    gid: uuid.UUID = Field(default_factory=uuid.uuid4, index=True, unique=True, nullable=False)
    password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OTP(SQLModel, table=True):
    """
    OTP Database Model

    :param username - str: associated username (primary key)
    :param code - str: OTP code
    :param expires_at - datetime: OTP expiration timestamp
    """
    username: str = Field(primary_key=True) # Mỗi user chỉ có 1 mã OTP hiệu lực tại 1 thời điểm
    code: str
    expires_at: datetime

class UserCreate(UserBase):
    """
    User Create Request Model

    :param password - str: plain password
    :param otp - str: OTP code for verification
    """
    password: str
    otp: str

class UserPublic(UserBase):
    """
    Public User Model

    :param gid - uuid.UUID: global unique identifier
    :param created_at - datetime: account creation timestamp
    """
    gid: uuid.UUID
    created_at: datetime

class OTPRequest(BaseModel):
    """
    OTP Request Model

    :param username - str: username for OTP request
    :param password - str | None: optional password for login
    :param email - str | None: optional email to send OTP
    :param type - str: request type ("register" or "login")
    """
    username: str
    password: str | None = None
    email: str | None = None
    type: str = "register"