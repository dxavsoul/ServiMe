// Industry Types Service - API service for industry types endpoint

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  IndustryTypesReadIndustryTypesData,
  IndustryTypesCreateIndustryTypeData,
  IndustryTypesReadIndustryTypeData,
  IndustryTypesUpdateIndustryTypeData,
  IndustryTypesDeleteIndustryTypeData,
  IndustryTypesPublic,
  IndustryTypePublic,
} from "./industry-types"

export class IndustryTypesService {
  /**
   * Read Industry Types
   * Retrieve industry types.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.active_only
   * @returns IndustryTypesPublic Successful Response
   * @throws ApiError
   */
  public static readIndustryTypes(
    data: IndustryTypesReadIndustryTypesData = {},
  ): CancelablePromise<IndustryTypesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/industry-types/",
      query: {
        skip: data.skip,
        limit: data.limit,
        active_only: data.active_only,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Industry Type
   * Create new industry type.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns IndustryTypePublic Successful Response
   * @throws ApiError
   */
  public static createIndustryType(
    data: IndustryTypesCreateIndustryTypeData,
  ): CancelablePromise<IndustryTypePublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/industry-types/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Industry Type
   * Get industry type by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns IndustryTypePublic Successful Response
   * @throws ApiError
   */
  public static readIndustryType(
    data: IndustryTypesReadIndustryTypeData,
  ): CancelablePromise<IndustryTypePublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/industry-types/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Industry Type
   * Update an industry type.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns IndustryTypePublic Successful Response
   * @throws ApiError
   */
  public static updateIndustryType(
    data: IndustryTypesUpdateIndustryTypeData,
  ): CancelablePromise<IndustryTypePublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/industry-types/{id}",
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
   * Delete Industry Type
   * Delete an industry type.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteIndustryType(
    data: IndustryTypesDeleteIndustryTypeData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/industry-types/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}