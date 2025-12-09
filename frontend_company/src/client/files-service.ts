// Files Service - S3 file upload and management

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  FilesUploadFileData,
  FilesGetFileInfoData,
  FilesGetPresignedUrlData,
  FilesDeleteFileData,
  CompaniesUploadLogoData,
  CompaniesDeleteLogoData,
  CompaniesGetLogoUrlData,
  FileUploadResponse,
  FileInfoResponse,
  PresignedUrlResponse,
  FileDeleteResponse,
  HealthCheckResponse,
  UploadConfigResponse,
  CompanyLogoUrlResponse,
} from "./files"
import type { CompanyPublic } from "./companies"

export class FilesService {
  /**
   * Upload File
   * Upload a file to S3
   * @param data The data for the request.
   * @param data.formData
   * @returns FileUploadResponse Successful Response
   * @throws ApiError
   */
  public static uploadFile(
    data: FilesUploadFileData,
  ): CancelablePromise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', data.formData.file)
    if (data.formData.folder) {
      formData.append('folder', data.formData.folder)
    }
    if (data.formData.public_read !== undefined) {
      formData.append('public_read', String(data.formData.public_read))
    }

    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/files/upload",
      body: formData,
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get File Info
   * Get metadata information about a file
   * @param data The data for the request.
   * @param data.file_key
   * @returns FileInfoResponse Successful Response
   * @throws ApiError
   */
  public static getFileInfo(
    data: FilesGetFileInfoData,
  ): CancelablePromise<FileInfoResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/files/info/{file_key}".replace(
        "{file_key}",
        encodeURIComponent(String(data.file_key)),
      ),
      errors: {
        404: "File not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Presigned URL
   * Generate presigned URL for accessing private files
   * @param data The data for the request.
   * @param data.file_key
   * @param data.expiration
   * @returns PresignedUrlResponse Successful Response
   * @throws ApiError
   */
  public static getPresignedUrl(
    data: FilesGetPresignedUrlData,
  ): CancelablePromise<PresignedUrlResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/files/presigned-url/{file_key}".replace(
        "{file_key}",
        encodeURIComponent(String(data.file_key)),
      ),
      query: {
        expiration: data.expiration,
      },
      errors: {
        404: "File not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete File
   * Delete a file from S3
   * @param data The data for the request.
   * @param data.file_key
   * @returns FileDeleteResponse Successful Response
   * @throws ApiError
   */
  public static deleteFile(
    data: FilesDeleteFileData,
  ): CancelablePromise<FileDeleteResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/files/{file_key}".replace(
        "{file_key}",
        encodeURIComponent(String(data.file_key)),
      ),
      errors: {
        404: "File not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Health Check
   * Health check for S3 service
   * @returns HealthCheckResponse Successful Response
   * @throws ApiError
   */
  public static healthCheck(): CancelablePromise<HealthCheckResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/files/health",
    })
  }

  /**
   * Get Upload Config
   * Get file upload configuration
   * @returns UploadConfigResponse Successful Response
   * @throws ApiError
   */
  public static getUploadConfig(): CancelablePromise<UploadConfigResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/files/config",
    })
  }

  /**
   * Upload Company Logo
   * Upload company logo (images only)
   * @param data The data for the request.
   * @param data.company_id
   * @param data.formData
   * @returns CompanyPublic Successful Response
   * @throws ApiError
   */
  public static uploadCompanyLogo(
    data: CompaniesUploadLogoData,
  ): CancelablePromise<CompanyPublic> {
    const formData = new FormData()
    formData.append('file', data.formData.file)

    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/companies/{company_id}/upload-logo".replace(
        "{company_id}",
        encodeURIComponent(String(data.company_id)),
      ),
      body: formData,
      errors: {
        404: "Company not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Company Logo
   * Delete company logo
   * @param data The data for the request.
   * @param data.company_id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteCompanyLogo(
    data: CompaniesDeleteLogoData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/companies/{company_id}/logo".replace(
        "{company_id}",
        encodeURIComponent(String(data.company_id)),
      ),
      errors: {
        404: "Company not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Company Logo URL
   * Get presigned URL for company logo
   * @param data The data for the request.
   * @param data.company_id
   * @param data.expiration
   * @returns CompanyLogoUrlResponse Successful Response
   * @throws ApiError
   */
  public static getCompanyLogoUrl(
    data: CompaniesGetLogoUrlData,
  ): CancelablePromise<CompanyLogoUrlResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/companies/{company_id}/logo-url".replace(
        "{company_id}",
        encodeURIComponent(String(data.company_id)),
      ),
      query: {
        expiration: data.expiration,
      },
      errors: {
        404: "Company not found",
        422: "Validation Error",
      },
    })
  }
}
