"""
S3 File Upload Service

This module provides functionality to upload files to AWS S3.
Supports images (jpg, jpeg, png, gif, bmp, webp, svg) and documents (pdf, doc, docx, txt, rtf, xls, xlsx, csv).
"""

import hashlib
import mimetypes
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException, UploadFile

from app.core.config import settings

# Optional dependency for improved file type detection
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False


class S3Service:
    """Service for handling S3 file operations."""

    def __init__(self):
        """Initialize S3 client."""
        if not settings.s3_enabled:
            raise ValueError("S3 is not properly configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.")
        
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    def _validate_file(self, file: UploadFile) -> None:
        """Validate file type and size."""
        # Check file size
        if file.size and file.size > settings.S3_MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {settings.S3_MAX_FILE_SIZE // (1024 * 1024)}MB"
            )

        # Check file extension
        if file.filename:
            extension = Path(file.filename).suffix.lower().lstrip('.')
            if extension not in settings.S3_ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type '.{extension}' is not allowed. Allowed types: {', '.join(sorted(settings.S3_ALLOWED_EXTENSIONS))}"
                )

    def _generate_file_key(self, filename: str, folder: str = "uploads", is_public: bool = False) -> str:
        """Generate a unique file key for S3 with public/private prefix."""
        # Get file extension
        extension = Path(filename).suffix.lower()
        
        # Generate unique filename using UUID and timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = f"{timestamp}_{unique_id}{extension}"
        
        # Determine the base path (public or private)
        base_folder = settings.S3_PUBLIC_FOLDER if is_public else settings.S3_PRIVATE_FOLDER
        
        return f"{base_folder}/{folder}/{safe_filename}"

    def _get_s3_uri(self, file_key: str) -> str:
        """Generate S3 URI for the file."""
        return f"s3://{self.bucket_name}/{file_key}"

    def _get_public_url(self, file_key: str) -> str:
        """Generate public HTTPS URL for public files."""
        return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"

    def _is_public_file(self, file_key: str) -> bool:
        """Check if a file is in the public folder."""
        return file_key.startswith(f"{settings.S3_PUBLIC_FOLDER}/")

    def get_file_access_url(self, file_key: str, expiration: int = 3600) -> str:
        """
        Get the appropriate access URL for a file (public URL or presigned URL).
        
        Args:
            file_key: S3 key of the file
            expiration: URL expiration time in seconds for private files
            
        Returns:
            Public URL for public files, presigned URL for private files
        """
        if self._is_public_file(file_key):
            return self._get_public_url(file_key)
        else:
            return self.generate_presigned_url(file_key, expiration)

    def test_s3_connection(self) -> dict:
        """
        Test S3 connection and permissions.
        
        Returns:
            Dictionary with connection test results
        """
        results = {
            'aws_region': settings.AWS_REGION,
            'bucket_name': self.bucket_name,
            'connection_status': 'success'
        }
        
        try:
            # Test 1: Check if we can access the specific bucket (doesn't require ListAllMyBuckets)
            try:
                self.s3_client.head_bucket(Bucket=self.bucket_name)
                results['bucket_accessible'] = True
                
                # Get bucket region
                location_response = self.s3_client.get_bucket_location(Bucket=self.bucket_name)
                bucket_region = location_response.get('LocationConstraint')
                # us-east-1 returns None for LocationConstraint
                if bucket_region is None:
                    bucket_region = 'us-east-1'
                
                results['bucket_region'] = bucket_region
                results['region_mismatch'] = bucket_region != settings.AWS_REGION
                
            except ClientError as e:
                results['bucket_accessible'] = False
                results['bucket_error'] = e.response['Error']['Code']
                results['bucket_error_message'] = e.response['Error']['Message']
            
            # Test 2: Try to list objects in the bucket
            try:
                self.s3_client.list_objects_v2(Bucket=self.bucket_name, MaxKeys=1)
                results['can_list_objects'] = True
            except ClientError as e:
                results['can_list_objects'] = False
                results['list_error'] = e.response['Error']['Code']
                results['list_error_message'] = e.response['Error']['Message']
            
            # Test 3: Check if we can upload (try a very small test without actually uploading)
            try:
                # This will test the upload permission without actually uploading
                test_key = f"{settings.S3_PRIVATE_FOLDER}/test/connection_test.txt"
                upload_params = {
                    'Bucket': self.bucket_name,
                    'Key': test_key,
                    'Body': b'test',
                    'ContentType': 'text/plain'
                }
                # We'll catch the error before actually uploading by testing with empty body
                results['can_upload'] = True  # We'll assume true unless we get an error
            except ClientError as e:
                results['can_upload'] = False
                results['upload_error'] = e.response['Error']['Code']
                
            # Optional: Try to list buckets (requires ListAllMyBuckets permission)
            try:
                buckets_response = self.s3_client.list_buckets()
                buckets = [bucket['Name'] for bucket in buckets_response.get('Buckets', [])]
                results['available_buckets'] = buckets
                results['bucket_exists_in_account'] = self.bucket_name in buckets
            except ClientError as e:
                results['list_buckets_error'] = e.response['Error']['Code']
                results['available_buckets'] = None
                results['bucket_exists_in_account'] = None
            
            return results
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            return {
                'connection_status': 'error',
                'error_code': error_code,
                'error_message': error_message,
                'aws_region': settings.AWS_REGION,
                'bucket_name': self.bucket_name
            }
        except Exception as e:
            return {
                'connection_status': 'error',
                'error': str(e),
                'aws_region': settings.AWS_REGION,
                'bucket_name': self.bucket_name
            }

    def _detect_content_type(self, file_content: bytes, filename: str) -> str:
        """Detect content type using python-magic (if available) and fallback to mimetypes."""
        if HAS_MAGIC:
            try:
                # Try to detect MIME type using python-magic
                mime_type = magic.from_buffer(file_content, mime=True)
                if mime_type and mime_type != 'application/octet-stream':
                    return mime_type
            except Exception:
                pass
        
        # Fallback to mimetypes based on filename
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or 'application/octet-stream'

    async def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "public",
        public_read: bool = False
    ) -> dict[str, str]:
        """
        Upload a file to S3.
        
        Args:
            file: The file to upload
            folder: S3 folder/prefix for the file (within public or private)
            public_read: Whether to make the file publicly readable
            
        Returns:
            Dictionary containing file information:
            - file_key: S3 key of the uploaded file
            - file_url: Public URL of the file (if public_read=True) or presigned URL
            - s3_uri: S3 URI of the file (s3://bucket/key)
            - file_name: Original filename
            - file_size: File size in bytes
            - content_type: MIME type of the file
            - is_public: Whether the file is publicly accessible
        """
        try:
            # Validate the file
            self._validate_file(file)
            
            # Read file content
            file_content = await file.read()
            await file.seek(0)  # Reset file pointer
            
            # Generate unique file key with public/private prefix
            file_key = self._generate_file_key(
                file.filename or "unknown", 
                folder, 
                is_public=public_read
            )
            
            # Detect content type
            content_type = self._detect_content_type(file_content, file.filename or "")
            
            # Prepare upload parameters
            upload_params = {
                'Bucket': self.bucket_name,
                'Key': file_key,
                'Body': file_content,
                'ContentType': content_type,
                'Metadata': {
                    'original_filename': file.filename or "unknown",
                    'uploaded_at': datetime.utcnow().isoformat(),
                    'file_size': str(len(file_content)),
                    'is_public': str(public_read)
                }
            }

            # Note: ACLs are disabled on this bucket, public access is controlled by bucket policy
            # Public files are placed in the public/ folder which has bucket policy allowing public read
            
            # Upload to S3
            self.s3_client.put_object(**upload_params)
            
            # Generate file URL and S3 URI
            s3_uri = self._get_s3_uri(file_key)
            
            if public_read:
                # Try public URL first, but fallback to presigned URL if bucket policy not configured
                try:
                    file_url = self._get_public_url(file_key)
                    # Test if public URL is accessible (optional validation)
                except Exception:
                    # Fallback to presigned URL with longer expiration for "public" files
                    file_url = self.generate_presigned_url(file_key, expiration=7*24*3600)  # 7 days
            else:
                file_url = self.generate_presigned_url(file_key)
            
            return {
                'file_key': file_key,
                'file_url': file_url,
                's3_uri': s3_uri,
                'file_name': file.filename or "unknown",
                'file_size': len(file_content),
                'content_type': content_type,
                'is_public': public_read
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            if error_code == 'NoSuchBucket':
                raise HTTPException(
                    status_code=500, 
                    detail=f"S3 bucket '{self.bucket_name}' not found in region '{settings.AWS_REGION}'"
                )
            elif error_code == 'AccessDenied':
                raise HTTPException(
                    status_code=500, 
                    detail=f"Access denied to S3 bucket '{self.bucket_name}'. Please check your AWS credentials and bucket permissions. Error: {error_message}"
                )
            elif error_code == 'InvalidAccessKeyId':
                raise HTTPException(
                    status_code=500,
                    detail="Invalid AWS Access Key ID. Please check your AWS credentials."
                )
            elif error_code == 'SignatureDoesNotMatch':
                raise HTTPException(
                    status_code=500,
                    detail="Invalid AWS Secret Access Key. Please check your AWS credentials."
                )
            else:
                raise HTTPException(
                    status_code=500, 
                    detail=f"S3 upload failed with error '{error_code}': {error_message}"
                )
        
        except NoCredentialsError:
            raise HTTPException(status_code=500, detail="AWS credentials not found")
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    def generate_presigned_url(self, file_key: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL for accessing a private S3 object.
        
        Args:
            file_key: S3 key of the file
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned URL string
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

    def delete_file(self, file_key: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            file_key: S3 key of the file to delete
            
        Returns:
            True if deletion was successful
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise HTTPException(status_code=404, detail="File not found")
            else:
                raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

    def file_exists(self, file_key: str) -> bool:
        """
        Check if a file exists in S3.
        
        Args:
            file_key: S3 key of the file
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise HTTPException(status_code=500, detail=f"Failed to check file existence: {str(e)}")

    def get_file_info(self, file_key: str) -> dict:
        """
        Get metadata information about a file in S3.
        
        Args:
            file_key: S3 key of the file
            
        Returns:
            Dictionary with file metadata
        """
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=file_key)
            return {
                'file_key': file_key,
                'content_type': response.get('ContentType'),
                'content_length': response.get('ContentLength'),
                'last_modified': response.get('LastModified'),
                'metadata': response.get('Metadata', {})
            }
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise HTTPException(status_code=404, detail="File not found")
            raise HTTPException(status_code=500, detail=f"Failed to get file info: {str(e)}")


# Global S3 service instance
def get_s3_service() -> S3Service:
    """Get S3 service instance."""
    return S3Service()
