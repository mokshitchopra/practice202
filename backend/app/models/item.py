"""
Item model for marketplace listings
"""

from sqlalchemy import Column, String, Text, Float, Boolean, ForeignKey, Enum
from .base import BaseModel
from ..enums.item import ItemCondition, ItemStatus, ItemCategory


class Item(BaseModel):
    __tablename__ = "items"

    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False, index=True)
    
    # Item details
    condition = Column(Enum(ItemCondition), nullable=False)
    status = Column(Enum(ItemStatus), default=ItemStatus.AVAILABLE, nullable=False)
    category = Column(Enum(ItemCategory), nullable=False)
    
    # Location and availability
    location = Column(String(200), nullable=True)
    is_negotiable = Column(Boolean, default=True)
    
    # S3 URL for item image
    item_url = Column(String(500), nullable=True)  # S3 URL for item image
    
    # Foreign keys
    seller_id = Column(ForeignKey("users.id"), nullable=False)  # Reference to user ID