// Service Requests Service - Admin/employee/manager service request management

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type {
  ServiceRequestsReadServiceRequestsData,
  ServiceRequestsUpdateServiceRequestData,
  ServiceRequestsAssignBranchData,
  ServiceRequestsPublic,
  ServiceRequestPublic,
} from "./service-requests"

export class ServiceRequestsService {
  /**
   * Get All Service Requests
   * Get service requests with optional filters. Admin/employee/manager only.
   * @param data The data for the request.
   * @param data.skip Number of records to skip for pagination (default: 0)
   * @param data.limit Maximum number of records to return (default: 100)
   * @param data.status Optional filter by status
   * @param data.customer_id Optional filter by customer UUID
   * @param data.service_id Optional filter by service UUID
   * @param data.branch_id Optional filter by branch UUID
   * @returns ServiceRequestsPublic Successful Response
   * @throws ApiError
   */
  public static readServiceRequests(
    data: ServiceRequestsReadServiceRequestsData = {},
  ): CancelablePromise<ServiceRequestsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/service-requests/",
      query: {
        skip: data.skip,
        limit: data.limit,
        status: data.status,
        customer_id: data.customer_id,
        service_id: data.service_id,
        branch_id: data.branch_id,
      },
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        422: "Validation Error",
      },
    })
  }

  /**
   * Admin Update Service Request
   * Admin update service request (can update any field including status).
   * @param data The data for the request.
   * @param data.request_id The unique identifier of the service request
   * @param data.requestBody Service request update data
   * @returns ServiceRequestPublic Successful Response
   * @throws ApiError
   */
  public static adminUpdateServiceRequest(
    data: ServiceRequestsUpdateServiceRequestData,
  ): CancelablePromise<ServiceRequestPublic> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/service-requests/admin/{request_id}".replace(
        "{request_id}",
        encodeURIComponent(String(data.request_id)),
      ),
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        404: "Service request not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Assign Service Request to Branch
   * Assign service request to a branch. Admin only.
   * @param data The data for the request.
   * @param data.request_id The unique identifier of the service request
   * @param data.branch_id The unique identifier of the branch to assign
   * @returns ServiceRequestPublic Successful Response
   * @throws ApiError
   */
  public static assignServiceRequestToBranch(
    data: ServiceRequestsAssignBranchData,
  ): CancelablePromise<ServiceRequestPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/service-requests/admin/{request_id}/assign-branch".replace(
        "{request_id}",
        encodeURIComponent(String(data.request_id)),
      ),
      query: {
        branch_id: data.branch_id,
      },
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        404: "Service request not found",
        400: "Branch not found or invalid",
        422: "Validation Error",
      },
    })
  }
}
