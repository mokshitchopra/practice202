"""
Item schemas for request/response models
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..enums.item import ItemCondition, ItemStatus, ItemCategory


class ItemCreate(BaseModel):
    title: str
    description: str
    price: float
    condition: ItemCondition
    category: ItemCategory
    location: Optional[str] = None
    is_negotiable: bool = True
    item_url: Optional[str] = None  # S3 URL for item image


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[ItemCondition] = None
    category: Optional[ItemCategory] = None
    location: Optional[str] = None
    is_negotiable: Optional[bool] = None
    status: Optional[ItemStatus] = None
    item_url: Optional[str] = None  # S3 URL for item image


class ItemResponse(BaseModel):
    id: int
    title: str
    description: str
    price: float
    condition: ItemCondition
    status: ItemStatus
    category: ItemCategory
    location: Optional[str]
    is_negotiable: bool
    item_url: Optional[str]  # S3 URL for item image
    seller_id: str
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ItemFilter(BaseModel):
    """Filter parameters for item search"""
    category: Optional[ItemCategory] = None
    condition: Optional[ItemCondition] = None
    status: Optional[ItemStatus] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    seller_id: Optional[str] = None
    location: Optional[str] = None
    search_term: Optional[str] = None  # Search in title/description