from fastapi import HTTPException
from .auth import get_password_hash
from sqlmodel import Session, select
from datetime import datetime, timezone
from .models import User, UserCreate, OTP

def get_user_by_username(session: Session, username: str):
    """
    Get user by username
    
    :param session - Session: Database session
    :param username - str: username to search
    """
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()

def create_user(session: Session, user_in: UserCreate):
    """
    Create a new user
    
    :param session - Session: Database session
    :param user_in - UserCreate: User data to create
    :return: Created User
    """
    # hash password
    hashed_password = get_password_hash(user_in.password)
    
    # create user instance with hashed password
    db_user = User(
        username=user_in.username,
        role=user_in.role,
        password=hashed_password,
        email=user_in.email
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def verify_otp(session: Session, username: str, input_otp: str):
    """
    Verify OTP for a user
    
    :param session - Session: Database session
    :param username - str: Username to verify OTP
    :param input_otp - str: Input OTP to verify
    :return: True if OTP is valid, else raise HTTPException
    """
    otp_record = session.get(OTP, username)
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not requested or expired")
    
    if otp_record.code != input_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    otp_expires_at = otp_record.expires_at
    if otp_expires_at.tzinfo is None:
        otp_expires_at = otp_expires_at.replace(tzinfo=timezone.utc)
    
    # Check if OTP is expired
    if datetime.now(timezone.utc) > otp_expires_at:
        session.delete(otp_record)
        session.commit()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # OTP is valid, delete it after verification
    session.delete(otp_record)
    session.commit()
    return True

def create_default_admin(session: Session):
    """
    Create a default admin user if not exists
    
    :param session - Session: Database session
    """
    # Check if admin user already exists
    statement = select(User).where(User.username == "admin")
    user = session.exec(statement).first()
    
    # If not, create default admin user
    if not user:
        print("Creating default admin user...")
        hashed_pwd = get_password_hash("admin")
        admin_user = User(
            username="admin",
            password=hashed_pwd,
            role="admin"
        )
        session.add(admin_user)
        session.commit()
        print("Admin user created: admin / admin")
    else:
        print("Admin user already exists.")