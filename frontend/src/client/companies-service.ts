// Companies Service - Updated to match new API specification

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  CompaniesReadCompaniesData,
  CompaniesReadMyCompaniesData,
  CompaniesReadCompaniesWithLocationData,
  CompaniesCreateCompanyData,
  CompaniesReadCompanyData,
  CompaniesReadCompanyWithLocationData,
  CompaniesUpdateCompanyData,
  CompaniesDeleteCompanyData,
  CompaniesPublic,
  CompaniesWithLocationPublic,
  CompanyPublic,
  CompanyWithLocationPublic,
} from "./companies"

export class CompaniesService {
  /**
   * Read Companies
   * Get all companies.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns CompaniesPublic Successful Response
   * @throws ApiError
   */
  public static readCompanies(
    data: CompaniesReadCompaniesData = {},
  ): CancelablePromise<CompaniesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/companies/",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Company
   * Get company by ID.
   * @param data The data for the request.
   * @param data.company_id
   * @returns CompanyPublic Successful Response
   * @throws ApiError
   */
  public static readCompany(
    data: CompaniesReadCompanyData,
  ): CancelablePromise<CompanyPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/companies/{company_id}".replace(
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
   * Create Company
   * Create new company.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns CompanyPublic Successful Response
   * @throws ApiError
   */
  public static createCompany(
    data: CompaniesCreateCompanyData,
  ): CancelablePromise<CompanyPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/companies/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Company
   * Update company (owner or superuser).
   * @param data The data for the request.
   * @param data.company_id
   * @param data.requestBody
   * @returns CompanyPublic Successful Response
   * @throws ApiError
   */
  public static updateCompany(
    data: CompaniesUpdateCompanyData,
  ): CancelablePromise<CompanyPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/companies/{company_id}".replace(
        "{company_id}",
        encodeURIComponent(String(data.company_id)),
      ),
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Company not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Company
   * Delete company (owner or superuser).
   * @param data The data for the request.
   * @param data.company_id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteCompany(
    data: CompaniesDeleteCompanyData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/companies/{company_id}".replace(
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
   * Read My Companies
   * Get user's companies.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns CompaniesPublic Successful Response
   * @throws ApiError
   */
  public static readMyCompanies(
    data: CompaniesReadMyCompaniesData = {},
  ): CancelablePromise<CompaniesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/companies/my/companies",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Companies With Location
   * Get companies with location details.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns CompaniesWithLocationPublic Successful Response
   * @throws ApiError
   */
  public static readCompaniesWithLocation(
    data: CompaniesReadCompaniesWithLocationData = {},
  ): CancelablePromise<CompaniesWithLocationPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/companies/with-location",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Company With Location
   * Get company with location details.
   * @param data The data for the request.
   * @param data.company_id
   * @returns CompanyWithLocationPublic Successful Response
   * @throws ApiError
   */
  public static readCompanyWithLocation(
    data: CompaniesReadCompanyWithLocationData,
  ): CancelablePromise<CompanyWithLocationPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/companies/{company_id}/with-location".replace(
        "{company_id}",
        encodeURIComponent(String(data.company_id)),
      ),
      errors: {
        404: "Company not found",
        422: "Validation Error",
      },
    })
  }
}
