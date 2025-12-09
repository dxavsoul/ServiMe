"""
File upload API routes.

This module provides endpoints for uploading, managing, and accessing files in S3.
"""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.models.file_upload import (
    FileDeleteResponse,
    FileInfoResponse,
    FileUploadResponse,
    PresignedUrlResponse,
)
from app.services.s3_service import get_s3_service, S3Service

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(..., description="File to upload"),
    folder: str = Form(default="uploads", description="S3 folder/prefix for the file"),
    public_read: bool = Form(default=False, description="Whether to make the file publicly readable"),
    s3_service: S3Service = Depends(get_s3_service)
) -> FileUploadResponse:
    """
    Upload a file to S3.
    
    Supported file types:
    - Images: jpg, jpeg, png, gif, bmp, webp, svg
    - Documents: pdf, doc, docx, txt, rtf
    - Spreadsheets: xls, xlsx, csv
    
    Maximum file size: 10MB
    """
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    try:
        result = await s3_service.upload_file(
            file=file,
            folder=folder,
            public_read=public_read
        )
        
        return FileUploadResponse(
            file_key=result['file_key'],
            file_url=result['file_url'],
            s3_uri=result['s3_uri'],
            file_name=result['file_name'],
            file_size=result['file_size'],
            content_type=result['content_type'],
            is_public=result['is_public']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/info/{file_key:path}", response_model=FileInfoResponse)
async def get_file_info(
    file_key: str,
    s3_service: S3Service = Depends(get_s3_service)
) -> FileInfoResponse:
    """Get information about a file stored in S3."""
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    try:
        file_info = s3_service.get_file_info(file_key)
        return FileInfoResponse(**file_info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file info: {str(e)}")


@router.get("/presigned-url/{file_key:path}", response_model=PresignedUrlResponse)
async def generate_presigned_url(
    file_key: str,
    expiration: int = 3600,
    s3_service: S3Service = Depends(get_s3_service)
) -> PresignedUrlResponse:
    """
    Generate a presigned URL for accessing a private file.
    
    Args:
        file_key: S3 key of the file
        expiration: URL expiration time in seconds (default: 1 hour, max: 7 days)
    """
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    # Validate expiration time (max 7 days)
    if expiration > 7 * 24 * 3600:
        raise HTTPException(
            status_code=400,
            detail="Expiration time cannot exceed 7 days (604800 seconds)"
        )
    
    try:
        # Check if file exists
        if not s3_service.file_exists(file_key):
            raise HTTPException(status_code=404, detail="File not found")
        
        presigned_url = s3_service.generate_presigned_url(file_key, expiration)
        
        return PresignedUrlResponse(
            file_key=file_key,
            presigned_url=presigned_url,
            expires_in=expiration
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")


@router.delete("/{file_key:path}", response_model=FileDeleteResponse)
async def delete_file(
    file_key: str,
    s3_service: S3Service = Depends(get_s3_service)
) -> FileDeleteResponse:
    """Delete a file from S3."""
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    try:
        success = s3_service.delete_file(file_key)
        if success:
            return FileDeleteResponse(
                message="File deleted successfully",
                file_key=file_key
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete file")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/test-s3")
async def test_s3_connection(
    s3_service: S3Service = Depends(get_s3_service)
) -> JSONResponse:
    """Test S3 connection and diagnose any issues."""
    if not settings.s3_enabled:
        return JSONResponse(
            status_code=503,
            content={
                "status": "disabled",
                "message": "S3 service is not configured",
                "s3_enabled": False
            }
        )
    
    try:
        test_result = s3_service.test_s3_connection()
        
        if test_result['connection_status'] == 'success':
            return JSONResponse(
                content={
                    "status": "success",
                    "message": "S3 connection test successful",
                    **test_result
                }
            )
        else:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "failed",
                    "message": "S3 connection test failed",
                    **test_result
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "message": f"S3 connection test error: {str(e)}",
                "s3_enabled": True
            }
        )


@router.get("/health")
async def health_check() -> JSONResponse:
    """Health check endpoint for the file upload service."""
    if not settings.s3_enabled:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": "S3 service is not configured",
                "s3_enabled": False
            }
        )
    
    try:
        s3_service = get_s3_service()
        # Try to list objects to verify S3 connectivity
        s3_service.s3_client.list_objects_v2(Bucket=settings.S3_BUCKET_NAME, MaxKeys=1)
        
        return JSONResponse(
            content={
                "status": "healthy",
                "message": "S3 service is operational",
                "s3_enabled": True,
                "bucket_name": settings.S3_BUCKET_NAME,
                "public_folder": settings.S3_PUBLIC_FOLDER,
                "private_folder": settings.S3_PRIVATE_FOLDER,
                "max_file_size_mb": settings.S3_MAX_FILE_SIZE // (1024 * 1024),
                "allowed_extensions": sorted(list(settings.S3_ALLOWED_EXTENSIONS))
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": f"S3 service error: {str(e)}",
                "s3_enabled": True
            }
        )


@router.get("/config")
async def get_upload_config() -> JSONResponse:
    """Get file upload configuration information."""
    return JSONResponse(
        content={
            "max_file_size_bytes": settings.S3_MAX_FILE_SIZE,
            "max_file_size_mb": settings.S3_MAX_FILE_SIZE // (1024 * 1024),
            "allowed_extensions": sorted(list(settings.S3_ALLOWED_EXTENSIONS)),
            "s3_enabled": settings.s3_enabled,
            "bucket_name": settings.S3_BUCKET_NAME if settings.s3_enabled else None,
            "public_folder": settings.S3_PUBLIC_FOLDER if settings.s3_enabled else None,
            "private_folder": settings.S3_PRIVATE_FOLDER if settings.s3_enabled else None
        }
    )
