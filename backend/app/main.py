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
    Lifespan context manager for FastAPI app
    
    :param app - FastAPI: app instance
    """
    create_db_and_tables()
    crud.create_default_admin(session=Session(engine))
    yield

app = FastAPI(lifespan=lifespan)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware configuration
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
    return {"message": "Welcome to Login System API"}

# === API SEND OTP ===
@app.post("/send-otp")
@limiter.limit("5/minute")
def send_otp(
    request: Request,
    req: OTPRequest, 
    session: Session = Depends(get_session)
): 
    # --- Register Flow ---
    user = crud.get_user_by_username(session, req.username)
    print("REQUEST", req, user, req.username)
    if req.type == "register":
        # Check if user already exists
        if user:
            raise HTTPException(status_code=400, detail="Username already exists, cannot register")
    
    # --- Login Flow ---
    elif req.type == "login":
        if not req.password:
            raise HTTPException(status_code=400, detail="Password is required for login OTP request")
            
        # Check if user exists and password matches
        if not user or not auth.verify_password(req.password, user.password):
            raise HTTPException(status_code=400, detail="Invalid username or password for login OTP request")
            
    # --- Create and send OTP ---
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=1)
    
    # Invalidate any existing OTP for the user
    existing_otp = session.get(OTP, req.username)
    if existing_otp:
        session.delete(existing_otp)
        session.commit()
    
    # Create new OTP record and save to DB
    new_otp = OTP(username=req.username, code=otp_code, expires_at=expires_at)
    session.add(new_otp)
    session.commit()
    
    # Simulate sending OTP via Email or return to client
    if req.email or (user and user.email):
        # If email provided in request or user has email, "send" OTP via email (simulated Terminal print)
        print(f"\n[MOCK EMAIL SERVER] Sending OTP to {req.email or user.email}")
        print(f"Subject: Login Verification")
        print(f"Body: Your OTP code is {otp_code}\n")
        
        return {
            "message": f"OTP sent to email {req.email}",
            "otp_code": None
        }
    else:
        # No email provided, return OTP in response (for UI display/testing)
        return {
            "message": "OTP sent to UI",
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
    # Validation password strength
    if user_in.password:
        validate_password_strength(user_in.password)
    else:
        raise HTTPException(status_code=400, detail="Password is required")
    
    # Verify OTP
    crud.verify_otp(session, user_in.username, user_in.otp)
    
    # Check if username already exists
    user = crud.get_user_by_username(session, user_in.username)
    if user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    print("Creating user:", user_in)
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
    # Verify username and password
    user = crud.get_user_by_username(session, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify OTP after password is correct
    crud.verify_otp(session, form_data.username, otp)
    
    # Create JWT token after successful login
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# === API REFRESH TOKEN ===
@app.post("/refresh-token")
def refresh_token(current_user: User = Depends(auth.get_current_user)):
    """
    Refresh JWT access token for the current user 
    whether token is expired or about to expire and user is still active.
    """
    access_token = auth.create_access_token(data={"sub": current_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)