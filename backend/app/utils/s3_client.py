"""
AWS S3 client for file uploads and management
"""

import boto3
import magic
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException, UploadFile
from typing import Optional
import uuid
import logging
from ..config import settings

logger = logging.getLogger(__name__)


class S3Client:
    def __init__(self):
        """Initialize S3 client with configuration from settings"""
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
            self.bucket_name = settings.s3_bucket_name
            self.base_url = settings.s3_base_url
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            raise HTTPException(status_code=500, detail="S3 configuration error")

    async def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "uploads",
        custom_filename: Optional[str] = None
    ) -> str:
        """
        Upload file to S3 bucket
        
        Args:
            file: FastAPI UploadFile object
            folder: S3 folder/prefix (default: "uploads")
            custom_filename: Optional custom filename (generates UUID if not provided)
            
        Returns:
            str: Full S3 URL of uploaded file
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
            if file_extension not in settings.get_allowed_image_extensions():
                raise HTTPException(
                    status_code=400,
                    detail=f"File type {file_extension} not allowed. Allowed types: {settings.get_allowed_image_extensions()}"
                )
            
            # Generate filename
            if custom_filename:
                filename = f"{custom_filename}{file_extension}"
            else:
                filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # S3 key (path)
            s3_key = f"{folder}/{filename}"
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type or "application/octet-stream",
                ContentDisposition="inline"
            )
            
            # Return full URL
            return f"{self.base_url}/{s3_key}"
            
        except ClientError as e:
            logger.error(f"S3 upload error: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload file to S3")
        except NoCredentialsError:
            logger.error("S3 credentials not found")
            raise HTTPException(status_code=500, detail="S3 credentials not configured")
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {e}")
            raise HTTPException(status_code=500, detail="File upload failed")
        finally:
            await file.seek(0)  # Reset file pointer

    async def delete_file(self, s3_url: str) -> bool:
        """
        Delete file from S3 bucket
        
        Args:
            s3_url: Full S3 URL of the file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Extract S3 key from URL
            s3_key = s3_url.replace(f"{self.base_url}/", "")
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return True
            
        except ClientError as e:
            logger.error(f"S3 delete error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during S3 delete: {e}")
            return False

    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename"""
        if not filename or '.' not in filename:
            return ""
        return f".{filename.split('.')[-1].lower()}"

    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for private file access
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Optional[str]: Presigned URL or None if failed
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None


# Global S3 client instance
s3_client = S3Client()