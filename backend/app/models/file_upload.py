"""
Pydantic models for file upload operations.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """Response model for file upload operations."""
    
    file_key: str = Field(..., description="S3 key of the uploaded file")
    file_url: str = Field(..., description="URL to access the file")
    s3_uri: str = Field(..., description="S3 URI of the file (s3://bucket/key)")
    file_name: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    content_type: str = Field(..., description="MIME type of the file")
    is_public: bool = Field(..., description="Whether the file is publicly accessible")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")


class FileInfoResponse(BaseModel):
    """Response model for file information."""
    
    file_key: str = Field(..., description="S3 key of the file")
    content_type: Optional[str] = Field(None, description="MIME type of the file")
    content_length: Optional[int] = Field(None, description="File size in bytes")
    last_modified: Optional[datetime] = Field(None, description="Last modification timestamp")
    metadata: dict = Field(default_factory=dict, description="File metadata")


class FileDeleteResponse(BaseModel):
    """Response model for file deletion operations."""
    
    message: str = Field(..., description="Deletion result message")
    file_key: str = Field(..., description="S3 key of the deleted file")


class PresignedUrlResponse(BaseModel):
    """Response model for presigned URL generation."""
    
    file_key: str = Field(..., description="S3 key of the file")
    presigned_url: str = Field(..., description="Presigned URL for file access")
    expires_in: int = Field(..., description="URL expiration time in seconds")


class FileUploadRequest(BaseModel):
    """Request model for file upload configuration."""
    
    folder: str = Field(default="uploads", description="S3 folder/prefix for the file")
    public_read: bool = Field(default=False, description="Whether to make the file publicly readable")
    generate_presigned_url: bool = Field(default=True, description="Whether to generate a presigned URL for private files")
