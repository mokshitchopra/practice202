"""
Storage factory - chooses between S3 and local storage
"""

import logging
from typing import Union
from .s3_client import S3Client, get_s3_client
from .local_storage import LocalStorage
from ..config import settings

logger = logging.getLogger(__name__)

# Storage type: 's3' or 'local'
STORAGE_TYPE = getattr(settings, 'storage_type', 'local') if hasattr(settings, 'storage_type') else 'local'

_local_storage_instance = None

def get_local_storage() -> LocalStorage:
    """Get or create local storage instance"""
    global _local_storage_instance
    if _local_storage_instance is None:
        _local_storage_instance = LocalStorage()
    return _local_storage_instance

def get_storage():
    """
    Get the appropriate storage backend based on configuration
    
    Priority:
    1. storage_type setting in config (if set to 's3' or 'local')
    2. Auto-detect based on S3 credentials (if storage_type not set)
    
    Returns:
        Storage client (S3Client or LocalStorage)
    """
    # Get storage_type from config (defaults to 'local')
    storage_type = getattr(settings, 'storage_type', 'local')
    storage_type = storage_type.lower().strip() if storage_type else 'local'
    
    # If explicitly set to 'local', use local storage
    if storage_type == 'local':
        logger.info("Using local file storage (configured via storage_type setting)")
        return get_local_storage()
    
    # If explicitly set to 's3', try to use S3
    if storage_type == 's3':
        try:
            # Verify S3 credentials are provided
            aws_key = getattr(settings, 'aws_access_key_id', '')
            s3_bucket = getattr(settings, 's3_bucket_name', '')
            
            if not aws_key or not s3_bucket or not aws_key.strip() or not s3_bucket.strip():
                logger.warning("storage_type is set to 's3' but S3 credentials are missing. Falling back to local storage.")
                return get_local_storage()
            
            return get_s3_client()
        except Exception as e:
            logger.warning(f"Failed to initialize S3 (storage_type='s3'), falling back to local storage: {e}")
            return get_local_storage()
    
    # If storage_type is something else or not recognized, default to local
    logger.warning(f"Unknown storage_type '{storage_type}'. Using local storage.")
    return get_local_storage()

# Global storage instance (lazy initialization)
_storage_instance = None
_last_storage_type = None

def get_file_storage():
    """
    Get the file storage instance
    Re-evaluates if storage_type config has changed
    """
    global _storage_instance, _last_storage_type
    
    # Get current storage type from config
    current_storage_type = getattr(settings, 'storage_type', 'local')
    current_storage_type = current_storage_type.lower().strip() if current_storage_type else 'local'
    
    # Re-initialize if storage type changed or instance doesn't exist
    if _storage_instance is None or _last_storage_type != current_storage_type:
        _storage_instance = get_storage()
        _last_storage_type = current_storage_type
        logger.info(f"Storage instance initialized with type: {current_storage_type}")
    
    return _storage_instance

