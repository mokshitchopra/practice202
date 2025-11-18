"""
Enhanced authentication routes with JWT token management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    Token, UserLogin, UserCreate, UserResponse, 
    RefreshToken, TokenUserInfo, PasswordChange
)
from ..auth.jwt_handler import (
    verify_password, get_password_hash, create_access_token, 
    create_refresh_token, verify_refresh_token
)
from ..auth.dependencies import get_current_user, get_current_token_data, require_admin
from ..config import settings
from ..core.logging import get_logger, log_auth_event
from ..middleware.logging import DatabaseLoggingMiddleware

router = APIRouter()
logger = get_logger(__name__)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    if hasattr(request, 'client') and request.client:
        return request.client.host
    return "unknown"


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    Create a new user account
    """
    client_ip = get_client_ip(request)
    
    try:
        # Check if user already exists
        if get_user_by_email(db, user_data.email):
            log_auth_event(
                logger=logger,
                event="signup",
                email=user_data.email,
                ip_address=client_ip,
                success=False,
                reason="Email already registered"
            )
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Check if username already exists
        if get_user_by_username(db, user_data.username):
            log_auth_event(
                logger=logger,
                event="signup",
                email=user_data.email,
                ip_address=client_ip,
                success=False,
                reason="Username already taken"
            )
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        
        # Check if student ID already exists
        if db.query(User).filter(User.student_id == user_data.student_id).first():
            log_auth_event(
                logger=logger,
                event="signup",
                email=user_data.email,
                ip_address=client_ip,
                success=False,
                reason="Student ID already registered"
            )
            raise HTTPException(
                status_code=400,
                detail="Student ID already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            student_id=user_data.student_id,
            role=user_data.role,
            created_by=user_data.username
        )
        
        # Store in database
        with DatabaseLoggingMiddleware("INSERT", "users", logger) as db_log:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            db_log.set_record_count(1)
        
        # Log successful signup
        log_auth_event(
            logger=logger,
            event="signup",
            user_id=str(db_user.id),
            email=db_user.email,
            ip_address=client_ip,
            success=True
        )
        
        return db_user
    
    except HTTPException:
        raise
    except ValueError as e:
        # Handle password validation errors
        logger.warning(f"Password validation error for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Signup error for {user_data.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed due to server error"
        )


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Login with email and password to get access and refresh tokens
    """
    client_ip = get_client_ip(request)
    
    try:
        user = get_user_by_email(db, user_credentials.email)
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            log_auth_event(
                logger=logger,
                event="login",
                email=user_credentials.email,
                ip_address=client_ip,
                success=False,
                reason="Invalid credentials"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            log_auth_event(
                logger=logger,
                event="login",
                user_id=str(user.id),
                email=user.email,
                ip_address=client_ip,
                success=False,
                reason="Account deactivated"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create token data
        token_data = {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "full_name": user.full_name
        }
        
        # Create tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(token_data, expires_delta=access_token_expires)
        refresh_token = create_refresh_token(user.id)
        
        # Store tokens in database
        with DatabaseLoggingMiddleware("UPDATE", "users", logger):
            user.access_token = access_token
            user.refresh_token = refresh_token
            user.updated_by = user.username
            db.commit()
        
        # Log successful login
        log_auth_event(
            logger=logger,
            event="login",
            user_id=str(user.id),
            email=user.email,
            ip_address=client_ip,
            success=True
        )
        
        # Create user info for response
        user_info = TokenUserInfo(
            user_id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_verified=user.is_verified
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,  # Convert to seconds
            user=user_info
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {user_credentials.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed due to server error"
        )


@router.post("/refresh", response_model=Token)
def refresh_access_token(refresh_data: RefreshToken, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    try:
        user_id = verify_refresh_token(refresh_data.refresh_token)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new tokens
    token_data = {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "full_name": user.full_name
    }
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(token_data, expires_delta=access_token_expires)
    new_refresh_token = create_refresh_token(user.id)
    
    # Store new tokens in database
    user.access_token = access_token
    user.refresh_token = new_refresh_token
    user.updated_by = user.username
    db.commit()
    
    user_info = TokenUserInfo(
        user_id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_verified=user.is_verified
    )
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        user=user_info
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password and clear tokens for security
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.access_token = None  # Force re-login after password change
    current_user.refresh_token = None
    current_user.updated_by = current_user.username
    db.commit()
    
    return {"message": "Password changed successfully. Please log in again."}


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user (clear tokens from database)
    """
    # Clear tokens from database
    current_user.access_token = None
    current_user.refresh_token = None
    current_user.updated_by = current_user.username
    db.commit()
    
    return {"message": "Successfully logged out"}



