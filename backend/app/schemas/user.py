"""
User schemas for request/response models
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..enums.user import UserRole


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None  # Only admins can update roles
    is_active: Optional[bool] = None  # Only admins can update status
    is_verified: Optional[bool] = None  # Only admins can verify users


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    phone: Optional[str]
    student_id: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True