"""
Item management routes for marketplace listings with role-based access
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from ..database import get_db
from ..models.item import Item
from ..models.user import User
from ..schemas.item import ItemCreate, ItemUpdate, ItemResponse, ItemFilter
from ..auth.dependencies import (
    get_current_active_user, require_admin
)
from ..enums.item import ItemStatus, ItemCategory, ItemCondition
from ..enums.user import UserRole

router = APIRouter()


@router.post("/", response_model=ItemResponse)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Any user can create items
):
    """
    Create a new marketplace item (any authenticated user)
    """
    try:
        item_dict = item_data.dict()
        # Ensure status is set to AVAILABLE if not provided
        if 'status' not in item_dict:
            item_dict['status'] = ItemStatus.AVAILABLE
        
        db_item = Item(
            **item_dict,
            seller_id=current_user.id,
            created_by=current_user.username
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create item: {str(e)}"
        )


@router.get("/", response_model=List[ItemResponse])
def get_items(
    skip: int = 0,
    limit: int = 20,
    category: Optional[ItemCategory] = None,
    condition: Optional[ItemCondition] = None,
    status: Optional[ItemStatus] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    seller_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get marketplace items with filtering (public endpoint)
    """
    query = db.query(Item)
    
    # Always exclude removed items from public view
    query = query.filter(Item.status != ItemStatus.REMOVED)
    
    # Default to only showing available items for public view
    if status is None:
        query = query.filter(Item.status == ItemStatus.AVAILABLE)
    else:
        # Don't allow filtering by REMOVED status in public endpoint
        if status != ItemStatus.REMOVED:
            query = query.filter(Item.status == status)
    
    if category:
        query = query.filter(Item.category == category)
    if condition:
        query = query.filter(Item.condition == condition)
    if seller_id:
        query = query.filter(Item.seller_id == seller_id)
    if min_price is not None:
        query = query.filter(Item.price >= min_price)
    if max_price is not None:
        query = query.filter(Item.price <= max_price)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Item.title.ilike(search_term)) | 
            (Item.description.ilike(search_term))
        )
    
    items = query.offset(skip).limit(limit).all()
    return items


@router.get("/my-items", response_model=List[ItemResponse])
def get_my_items(
    status: Optional[ItemStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's items (any authenticated user)
    Excludes removed items unless explicitly requested
    """
    query = db.query(Item).filter(Item.seller_id == current_user.id)
    
    # Exclude removed items by default
    if status:
        # Only show removed items if explicitly requested
        query = query.filter(Item.status == status)
    else:
        # Default: exclude removed items
        query = query.filter(Item.status != ItemStatus.REMOVED)
    
    return query.all()


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """
    Get item by ID (public endpoint)
    Returns 404 if item is removed
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Don't show removed items
    if item.status == ItemStatus.REMOVED:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return item


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item_update: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an item (only by owner or admin)
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check authorization
    if item.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to update this item"
        )
    
    # Update fields
    for field, value in item_update.dict(exclude_unset=True).items():
        setattr(item, field, value)
    
    item.updated_by = current_user.username
    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/mark-sold")
def mark_item_sold(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark item as sold (owner or admin only)
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check authorization
    if item.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this item"
        )
    
    item.status = ItemStatus.SOLD
    item.updated_by = current_user.username
    db.commit()
    return {"message": "Item marked as sold"}


@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an item (owner or admin only) - soft delete by marking as REMOVED
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check authorization
    if item.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
    
    # Soft delete by changing status
    # Use direct SQL update to bypass SQLAlchemy enum conversion issue
    # The database enum expects lowercase 'removed', not 'REMOVED'
    db.execute(
        text("UPDATE items SET status = 'removed', updated_by = :updated_by, updated_at = now() WHERE id = :item_id"),
        {"item_id": item_id, "updated_by": current_user.username}
    )
    db.commit()
    
    return {"message": "Item deleted successfully"}


# Admin-only routes
@router.get("/admin/all", response_model=List[ItemResponse])
def get_all_items_admin(
    skip: int = 0,
    limit: int = 100,
    status: Optional[ItemStatus] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all items including removed ones (admin only)
    """
    query = db.query(Item)
    if status:
        query = query.filter(Item.status == status)
    
    return query.offset(skip).limit(limit).all()