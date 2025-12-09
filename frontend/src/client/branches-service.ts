// Branches Service - Updated to match new API specification

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  BranchesReadBranchesData,
  BranchesCreateBranchData,
  BranchesReadBranchData,
  BranchesUpdateBranchData,
  BranchesDeleteBranchData,
  BranchesReadBranchesByCompanyData,
  BranchesPublic,
  BranchesWithCompanyPublic,
  BranchesWithLocationPublic,
  BranchesWithDetailsPublic,
  BranchPublic,
  BranchWithLocationPublic,
  BranchWithDetailsPublic,
} from "./branches"

export class BranchesService {
  /**
   * Read Branches
   * Retrieve branches with company information.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.company_id Optional: Filter branches by company
   * @returns BranchesWithCompanyPublic Successful Response
   * @throws ApiError
   */
  public static readBranches(
    data: BranchesReadBranchesData = {},
  ): CancelablePromise<BranchesWithCompanyPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/",
      query: {
        skip: data.skip,
        limit: data.limit,
        company_id: data.company_id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Branches With Locations
   * Retrieve branches with location/city information.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.company_id Optional: Filter branches by company
   * @returns BranchesWithLocationPublic Successful Response
   * @throws ApiError
   */
  public static readBranchesWithLocations(
    data: BranchesReadBranchesData = {},
  ): CancelablePromise<BranchesWithLocationPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/with-locations/",
      query: {
        skip: data.skip,
        limit: data.limit,
        company_id: data.company_id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Branches With Details
   * Retrieve branches with both company and location information.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.company_id Optional: Filter branches by company
   * @returns BranchesWithDetailsPublic Successful Response
   * @throws ApiError
   */
  public static readBranchesWithDetails(
    data: BranchesReadBranchesData = {},
  ): CancelablePromise<BranchesWithDetailsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/with-details/",
      query: {
        skip: data.skip,
        limit: data.limit,
        company_id: data.company_id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Branch
   * Create new branch.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns BranchPublic Successful Response
   * @throws ApiError
   */
  public static createBranch(
    data: BranchesCreateBranchData,
  ): CancelablePromise<BranchPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/branches/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Branch
   * Get branch by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns BranchPublic Successful Response
   * @throws ApiError
   */
  public static readBranch(
    data: BranchesReadBranchData,
  ): CancelablePromise<BranchPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Branch With Location
   * Get single branch with location information.
   * @param data The data for the request.
   * @param data.id
   * @returns BranchWithLocationPublic Successful Response
   * @throws ApiError
   */
  public static readBranchWithLocation(
    data: BranchesReadBranchData,
  ): CancelablePromise<BranchWithLocationPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/{id}/with-location",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Branch With Details
   * Get single branch with company and location information.
   * @param data The data for the request.
   * @param data.id
   * @returns BranchWithDetailsPublic Successful Response
   * @throws ApiError
   */
  public static readBranchWithDetails(
    data: BranchesReadBranchData,
  ): CancelablePromise<BranchWithDetailsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/{id}/with-details",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Branch
   * Update a branch.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns BranchPublic Successful Response
   * @throws ApiError
   */
  public static updateBranch(
    data: BranchesUpdateBranchData,
  ): CancelablePromise<BranchPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/branches/{id}",
      path: {
        id: data.id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Branch
   * Delete a branch.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteBranch(
    data: BranchesDeleteBranchData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/branches/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Branches By Company
   * Get branches for specific company.
   * @param data The data for the request.
   * @param data.company_id
   * @param data.skip
   * @param data.limit
   * @returns BranchesPublic Successful Response
   * @throws ApiError
   */
  public static readBranchesByCompany(
    data: BranchesReadBranchesByCompanyData,
  ): CancelablePromise<BranchesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/company/{company_id}",
      path: {
        company_id: data.company_id,
      },
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
   * Read My Branches
   * Get branches created by current user.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns BranchesPublic Successful Response
   * @throws ApiError
   */
  public static readMyBranches(
    data: BranchesReadBranchesData = {},
  ): CancelablePromise<BranchesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/my/branches",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}
