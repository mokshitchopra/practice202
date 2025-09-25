"""
Admin routes for moderation and management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..models.item import Item
from ..schemas.auth import UserResponse
from ..auth.dependencies import get_current_user, require_admin
from ..enums.user import UserRole

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """
    Dependency to require admin role
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user



@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Get all users (admin only)
    """
    return db.query(User).all()


@router.put("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Deactivate a user account (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    return {"message": f"User {user.username} has been deactivated"}