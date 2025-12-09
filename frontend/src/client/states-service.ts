// States Service - Location management module
// Structured to match the generated service pattern

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  StatesReadStatesData,
  StatesCreateStateData,
  StatesUpdateStateData,
  StatesDeleteStateData,
  StatesWithCountryPublic,
  StatePublic,
} from "./states"

export class StatesService {
  /**
   * Read States
   * Retrieve all states with country info.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.country_id
   * @param data.country_code
   * @param data.search
   * @returns StatesWithCountryPublic Successful Response
   * @throws ApiError
   */
  public static readStates(
    data: StatesReadStatesData = {},
  ): CancelablePromise<StatesWithCountryPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/locations/states",
      query: {
        skip: data.skip,
        limit: data.limit,
        country_id: data.country_id,
        country_code: data.country_code,
        search: data.search,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create State
   * Create new state (Admin only).
   * @param data The data for the request.
   * @param data.requestBody
   * @returns StatePublic Successful Response
   * @throws ApiError
   */
  public static createState(
    data: StatesCreateStateData,
  ): CancelablePromise<StatePublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/locations/states",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update State
   * Update state (Admin only).
   * @param data The data for the request.
   * @param data.state_id
   * @param data.requestBody
   * @returns StatePublic Successful Response
   * @throws ApiError
   */
  public static updateState(
    data: StatesUpdateStateData,
  ): CancelablePromise<StatePublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/locations/states/{state_id}".replace(
        "{state_id}",
        encodeURIComponent(String(data.state_id)),
      ),
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "State not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete State
   * Delete state (Admin only).
   * @param data The data for the request.
   * @param data.state_id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteState(
    data: StatesDeleteStateData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/locations/states/{state_id}".replace(
        "{state_id}",
        encodeURIComponent(String(data.state_id)),
      ),
      errors: {
        404: "State not found",
        422: "Validation Error",
      },
    })
  }
}
