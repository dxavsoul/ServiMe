// Services Service - structured to match the generated service pattern
// This will be replaced by auto-generated code when the backend API is available

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  ServicesReadServicesData,
  ServicesCreateServiceData,
  ServicesReadServiceData,
  ServicesUpdateServiceData,
  ServicesDeleteServiceData,
  ServicesReadServicesByDepartmentData,
  ServicesReadServicesByServiceTypeData,
  ServicesReadPromotionsData,
  ServicesPublic,
  ServicePublic,
} from "./services"

export class ServicesService {
  /**
   * Read Services
   * Retrieve all services.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ServicesPublic Successful Response
   * @throws ApiError
   */
  public static readServices(
    data: ServicesReadServicesData = {},
  ): CancelablePromise<ServicesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/services/",
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
   * Create Service
   * Create new service.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns ServicePublic Successful Response
   * @throws ApiError
   */
  public static createService(
    data: ServicesCreateServiceData,
  ): CancelablePromise<ServicePublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/services/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Service
   * Get service by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns ServicePublic Successful Response
   * @throws ApiError
   */
  public static readService(
    data: ServicesReadServiceData,
  ): CancelablePromise<ServicePublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/services/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Service
   * Update a service.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns ServicePublic Successful Response
   * @throws ApiError
   */
  public static updateService(
    data: ServicesUpdateServiceData,
  ): CancelablePromise<ServicePublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/services/{id}",
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
   * Delete Service
   * Delete a service.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteService(
    data: ServicesDeleteServiceData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/services/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Services by Department
   * Get all services for a specific department.
   * @param data The data for the request.
   * @param data.department_id
   * @param data.skip
   * @param data.limit
   * @returns ServicesPublic Successful Response
   * @throws ApiError
   */
  public static readServicesByDepartment(
    data: ServicesReadServicesByDepartmentData,
  ): CancelablePromise<ServicesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/services/department/{department_id}",
      path: {
        department_id: data.department_id,
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
   * Read Services by Service Type
   * Get services by service type.
   * @param data The data for the request.
   * @param data.service_type_id
   * @param data.skip
   * @param data.limit
   * @returns ServicesPublic Successful Response
   * @throws ApiError
   */
  public static readServicesByServiceType(
    data: ServicesReadServicesByServiceTypeData,
  ): CancelablePromise<ServicesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/services/service-type/{service_type_id}",
      path: {
        service_type_id: data.service_type_id,
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
   * Read Services with Promotions
   * Get services that have active promotions.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ServicesPublic Successful Response
   * @throws ApiError
   */
  public static readPromotions(
    data: ServicesReadPromotionsData = {},
  ): CancelablePromise<ServicesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/services/promotions/",
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
