// Service Types Service - structured to match the generated service pattern
// This will be replaced by auto-generated code when the backend API is available

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  ServiceTypesReadServiceTypesData,
  ServiceTypesCreateServiceTypeData,
  ServiceTypesReadServiceTypeData,
  ServiceTypesUpdateServiceTypeData,
  ServiceTypesDeleteServiceTypeData,
  ServiceTypesPublic,
  ServiceTypePublic,
} from "./service-types"

export class ServiceTypesService {
  /**
   * Read Service Types
   * Retrieve service types.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ServiceTypesPublic Successful Response
   * @throws ApiError
   */
  public static readServiceTypes(
    data: ServiceTypesReadServiceTypesData = {},
  ): CancelablePromise<ServiceTypesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/service-types/",
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
   * Create Service Type
   * Create new service type.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns ServiceTypePublic Successful Response
   * @throws ApiError
   */
  public static createServiceType(
    data: ServiceTypesCreateServiceTypeData,
  ): CancelablePromise<ServiceTypePublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/service-types/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Service Type
   * Get service type by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns ServiceTypePublic Successful Response
   * @throws ApiError
   */
  public static readServiceType(
    data: ServiceTypesReadServiceTypeData,
  ): CancelablePromise<ServiceTypePublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/service-types/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Service Type
   * Update a service type.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns ServiceTypePublic Successful Response
   * @throws ApiError
   */
  public static updateServiceType(
    data: ServiceTypesUpdateServiceTypeData,
  ): CancelablePromise<ServiceTypePublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/service-types/{id}",
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
   * Delete Service Type
   * Delete a service type.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteServiceType(
    data: ServiceTypesDeleteServiceTypeData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/service-types/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}
