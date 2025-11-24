"""
Local file storage for development/testing (alternative to S3)
"""

import os
import uuid
import shutil
from pathlib import Path
from fastapi import HTTPException, UploadFile
from typing import Optional
import logging
from ..config import settings

logger = logging.getLogger(__name__)


class LocalStorage:
    """Local filesystem storage for file uploads"""
    
    def __init__(self):
        """Initialize local storage with upload directory"""
        # Use uploads directory relative to this file's location
        # This file is in backend/app/utils/, so go up 2 levels to backend/
        backend_dir = Path(__file__).parent.parent.parent
        self.upload_dir = backend_dir / "uploads"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Base URL for serving files
        self.base_url = f"http://localhost:8001/uploads"
        
        logger.info(f"Local storage initialized: {self.upload_dir.absolute()}")
    
    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename"""
        if not filename or '.' not in filename:
            return ""
        return f".{filename.split('.')[-1].lower()}"
    
    async def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "uploads",
        custom_filename: Optional[str] = None
    ) -> str:
        """
        Upload file to local filesystem
        
        Args:
            file: FastAPI UploadFile object
            folder: Folder/prefix (default: "uploads")
            custom_filename: Optional custom filename (generates UUID if not provided)
            
        Returns:
            str: Full URL of uploaded file
        """
        try:
            # Validate file size
            file_size = 0
            content = await file.read()
            file_size = len(content)
            
            if file_size > settings.max_upload_size:
                raise HTTPException(
                    status_code=413, 
                    detail=f"File size {file_size} exceeds maximum allowed size {settings.max_upload_size}"
                )
            
            # Validate file type
            file_extension = self._get_file_extension(file.filename)
            # Remove leading dot for comparison (allowed extensions don't have dots)
            ext_without_dot = file_extension.lstrip('.')
            allowed_exts = settings.get_allowed_image_extensions()
            if ext_without_dot not in allowed_exts:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type {file_extension} not allowed. Allowed types: {allowed_exts}"
                )
            
            # Generate filename
            if custom_filename:
                filename = f"{custom_filename}{file_extension}"
            else:
                filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Create folder path
            folder_path = self.upload_dir / folder
            folder_path.mkdir(parents=True, exist_ok=True)
            
            # Full file path
            file_path = folder_path / filename
            
            # Write file to disk
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Return URL path (relative to uploads directory)
            url_path = f"{folder}/{filename}"
            return f"{self.base_url}/{url_path}"
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Local storage upload error: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload file")
        finally:
            await file.seek(0)  # Reset file pointer
    
    async def delete_file(self, file_url: str) -> bool:
        """
        Delete file from local filesystem
        
        Args:
            file_url: Full URL of the file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Extract relative path from URL
            # URL format: http://localhost:8001/uploads/folder/filename
            if "/uploads/" in file_url:
                relative_path = file_url.split("/uploads/")[-1]
            else:
                relative_path = file_url.replace(self.base_url + "/", "")
            
            file_path = self.upload_dir / relative_path
            
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {file_path}")
                return True
            else:
                logger.warning(f"File not found: {file_path}")
                return False
                
        except Exception as e:
            logger.error(f"Local storage delete error: {e}")
            return False
    
    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a URL for file access (local storage doesn't need presigned URLs)
        
        Args:
            file_path: File path relative to uploads directory
            expiration: Not used for local storage (kept for compatibility)
            
        Returns:
            str: Full URL to the file
        """
        return f"{self.base_url}/{file_path}"

