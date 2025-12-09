// File types for S3 upload service

export interface FileUploadResponse {
  file_key: string
  file_url: string
  file_name: string
  file_size: number
  content_type: string
  uploaded_at: string
}

export interface FileInfoResponse {
  file_key: string
  content_type: string
  content_length: number
  last_modified: string
  metadata: {
    original_filename: string
    uploaded_at: string
    file_size: string
  }
}

export interface PresignedUrlResponse {
  file_key: string
  presigned_url: string
  expires_in: number
}

export interface FileDeleteResponse {
  message: string
  file_key: string
}

export interface HealthCheckResponse {
  status: string
  message: string
  s3_enabled: boolean
  bucket_name: string
  max_file_size_mb: number
  allowed_extensions: string[]
}

export interface UploadConfigResponse {
  max_file_size_bytes: number
  max_file_size_mb: number
  allowed_extensions: string[]
  s3_enabled: boolean
  bucket_name: string
}

export interface CompanyLogoUrlResponse {
  company_id: string
  logo_url: string
  expires_in: number
}

// API Data types
export interface FilesUploadFileData {
  formData: {
    file: File
    folder?: string
    public_read?: boolean
  }
}

export interface FilesGetFileInfoData {
  file_key: string
}

export interface FilesGetPresignedUrlData {
  file_key: string
  expiration?: number
}

export interface FilesDeleteFileData {
  file_key: string
}

export interface CompaniesUploadLogoData {
  company_id: string
  formData: {
    file: File
  }
}

export interface CompaniesDeleteLogoData {
  company_id: string
}

export interface CompaniesGetLogoUrlData {
  company_id: string
  expiration?: number
}
