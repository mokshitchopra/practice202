"""
File upload routes using S3
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models.user import User
from ..utils.s3_client import s3_client

router = APIRouter(prefix="/files", tags=["File Management"])


@router.post("/upload", response_model=Dict[str, Any])
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "uploads",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file to S3 bucket
    
    - **file**: The file to upload
    - **folder**: S3 folder/prefix (optional, default: "uploads")
    
    Returns the S3 URL of the uploaded file
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a name")
    
    try:
        # Upload file to S3
        s3_url = await s3_client.upload_file(
            file=file, 
            folder=f"{folder}/user_{current_user.id}",  # Organize by user
            custom_filename=None  # Auto-generate UUID filename
        )
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "data": {
                "original_filename": file.filename,
                "s3_url": s3_url,
                "content_type": file.content_type,
                "uploaded_by": current_user.id
            }
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions from S3 client
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to upload file: {str(e)}"
        )


@router.delete("/delete")
async def delete_file(
    s3_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a file from S3 bucket
    
    - **s3_url**: The full S3 URL of the file to delete
    """
    if not s3_url:
        raise HTTPException(status_code=400, detail="S3 URL is required")
    
    # Basic security check - ensure user can only delete files from their folder
    user_folder_path = f"user_{current_user.id}"
    if user_folder_path not in s3_url and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=403, 
            detail="You can only delete your own files"
        )
    
    try:
        success = await s3_client.delete_file(s3_url)
        
        if success:
            return {
                "success": True,
                "message": "File deleted successfully",
                "data": {"s3_url": s3_url}
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="File not found or already deleted"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )


@router.post("/presigned-url")
async def generate_presigned_url(
    s3_key: str,
    expiration: int = 3600,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a presigned URL for private file access
    
    - **s3_key**: The S3 object key (path within bucket)
    - **expiration**: URL expiration time in seconds (default: 1 hour)
    """
    if not s3_key:
        raise HTTPException(status_code=400, detail="S3 key is required")
    
    try:
        presigned_url = s3_client.generate_presigned_url(s3_key, expiration)
        
        if presigned_url:
            return {
                "success": True,
                "message": "Presigned URL generated successfully",
                "data": {
                    "presigned_url": presigned_url,
                    "expires_in_seconds": expiration
                }
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate presigned URL"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )