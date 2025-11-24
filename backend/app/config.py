"""
Application configuration settings
"""

from pydantic_settings import BaseSettings
from pydantic import computed_field
from functools import lru_cache
from typing import List, Set


class Settings(BaseSettings):
    # Database Configuration (Individual Parameters)
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    db_driver: str = "postgresql"  # Only this has a default since it's unlikely to change
    
    @computed_field
    @property
    def database_url(self) -> str:
        """Compile database URL from individual parameters"""
        if self.db_driver == "sqlite":
            return f"sqlite:///./{self.db_name}.db"
        return f"{self.db_driver}://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    # Security (Required from environment)
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    
    # Application
    app_name: str
    debug: bool
    
    # CORS - loaded from environment
    allowed_origins: str
    
    # Storage Configuration
    # Set to 'local' for local filesystem storage or 's3' for AWS S3
    # Default: 'local' (for development/testing)
    storage_type: str = "local"
    
    # AWS S3 Configuration (Optional - defaults to empty strings if not provided)
    # Only used when storage_type is set to 's3'
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = ""
    s3_base_url: str = ""
    
    # File uploads
    max_upload_size: int
    allowed_image_extensions: str
    
    # Logging Configuration
    log_level: str
    log_format: str
    log_to_file: bool
    log_file_path: str
    log_max_size_mb: int
    log_backup_count: int
    log_to_console: bool
    
    def get_allowed_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.allowed_origins.split(',') if origin.strip()]
    
    def get_allowed_image_extensions(self) -> Set[str]:
        """Parse image extensions from comma-separated string"""
        return {ext.strip() for ext in self.allowed_image_extensions.split(',') if ext.strip()}

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()