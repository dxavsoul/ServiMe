// Customers Service - Admin only customer management

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  CustomersReadCustomersData,
  CustomersCreateCustomerData,
  CustomersReadCustomerData,
  CustomersUpdateCustomerData,
  CustomersDeleteCustomerData,
  CustomersSearchCustomersData,
  CustomersGetNearbyCustomersData,
  CustomersPublic,
  CustomerPublic,
  CustomerStats,
} from "./customers"

export class CustomersService {
  /**
   * List All Customers
   * Retrieve paginated list of all customers. Admin only.
   * @param data The data for the request.
   * @param data.skip Number of records to skip for pagination (default: 0)
   * @param data.limit Maximum number of records to return (default: 100)
   * @returns CustomersPublic Successful Response
   * @throws ApiError
   */
  public static readCustomers(
    data: CustomersReadCustomersData = {},
  ): CancelablePromise<CustomersPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/customers/",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Customer by ID
   * Retrieve a specific customer by their UUID. Admin only.
   * @param data The data for the request.
   * @param data.customer_id The unique identifier of the customer
   * @returns CustomerPublic Successful Response
   * @throws ApiError
   */
  public static readCustomer(
    data: CustomersReadCustomerData,
  ): CancelablePromise<CustomerPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/customers/{customer_id}".replace(
        "{customer_id}",
        encodeURIComponent(String(data.customer_id)),
      ),
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        404: "Customer not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Create New Customer
   * Create a new customer account. Admin only.
   * @param data The data for the request.
   * @param data.requestBody Customer data
   * @returns CustomerPublic Successful Response
   * @throws ApiError
   */
  public static createCustomer(
    data: CustomersCreateCustomerData,
  ): CancelablePromise<CustomerPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/customers/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        400: "A customer with this email already exists",
        401: "Unauthorized",
        403: "Not enough permissions",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Customer
   * Update a specific customer's information. Admin only.
   * @param data The data for the request.
   * @param data.customer_id The unique identifier of the customer
   * @param data.requestBody Updated customer data
   * @returns CustomerPublic Successful Response
   * @throws ApiError
   */
  public static updateCustomer(
    data: CustomersUpdateCustomerData,
  ): CancelablePromise<CustomerPublic> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/customers/{customer_id}".replace(
        "{customer_id}",
        encodeURIComponent(String(data.customer_id)),
      ),
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        404: "Customer not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Customer
   * Delete a specific customer account. Admin only.
   * @param data The data for the request.
   * @param data.customer_id The unique identifier of the customer
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteCustomer(
    data: CustomersDeleteCustomerData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/customers/{customer_id}".replace(
        "{customer_id}",
        encodeURIComponent(String(data.customer_id)),
      ),
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        404: "Customer not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Search Customers
   * Search customers by name, email, or phone number. Admin only.
   * @param data The data for the request.
   * @param data.q Search query string (default: "")
   * @param data.skip Number of records to skip for pagination (default: 0)
   * @param data.limit Maximum number of records to return (default: 100)
   * @returns CustomersPublic Successful Response
   * @throws ApiError
   */
  public static searchCustomers(
    data: CustomersSearchCustomersData = {},
  ): CancelablePromise<CustomersPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/customers/search",
      query: {
        q: data.q,
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Customers Near Location
   * Find customers within a specified radius of a location. Admin only.
   * @param data The data for the request.
   * @param data.latitude Latitude coordinate (-90 to 90)
   * @param data.longitude Longitude coordinate (-180 to 180)
   * @param data.radius_km Search radius in kilometers (default: 10.0)
   * @param data.skip Number of records to skip for pagination (default: 0)
   * @param data.limit Maximum number of records to return (default: 100)
   * @returns CustomersPublic Successful Response
   * @throws ApiError
   */
  public static getNearbyCustomers(
    data: CustomersGetNearbyCustomersData,
  ): CancelablePromise<CustomersPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/customers/location/nearby",
      query: {
        latitude: data.latitude,
        longitude: data.longitude,
        radius_km: data.radius_km,
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Customer Statistics
   * Retrieve comprehensive customer statistics. Admin only.
   * @returns CustomerStats Successful Response
   * @throws ApiError
   */
  public static getCustomerStats(): CancelablePromise<CustomerStats> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/customers/stats",
      errors: {
        401: "Unauthorized",
        403: "Not enough permissions",
      },
    })
  }
}
