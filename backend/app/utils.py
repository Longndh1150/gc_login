import re
from fastapi import HTTPException

def validate_password_strength(password: str):
    """
    Validate password strength when registering a new user.
    
    :param password - str: Password to validate
    :return: True if valid, else raise HTTPException
    """
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="At least 6 characters required for password")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 number")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 special character")
    return True