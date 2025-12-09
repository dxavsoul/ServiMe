// Cities Service - Location management module
// Structured to match the generated service pattern

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  CitiesReadCitiesData,
  CitiesReadNearbyCitiesData,
  CitiesCreateCityData,
  CitiesUpdateCityData,
  CitiesDeleteCityData,
  LocationsGetBulkData,
  CitiesWithDetailsPublic,
  CityPublic,
  LocationBulkData,
} from "./cities"

export class CitiesService {
  /**
   * Read Cities
   * Retrieve all cities with details.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.country_id
   * @param data.state_id
   * @param data.country_code
   * @param data.state_code
   * @param data.search
   * @param data.popular
   * @returns CitiesWithDetailsPublic Successful Response
   * @throws ApiError
   */
  public static readCities(
    data: CitiesReadCitiesData = {},
  ): CancelablePromise<CitiesWithDetailsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/locations/cities",
      query: {
        skip: data.skip,
        limit: data.limit,
        country_id: data.country_id,
        state_id: data.state_id,
        country_code: data.country_code,
        state_code: data.state_code,
        search: data.search,
        popular: data.popular,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Nearby Cities
   * Get nearby cities by coordinates.
   * @param data The data for the request.
   * @param data.latitude
   * @param data.longitude
   * @param data.radius_km
   * @param data.skip
   * @param data.limit
   * @returns CitiesWithDetailsPublic Successful Response
   * @throws ApiError
   */
  public static readNearbyCities(
    data: CitiesReadNearbyCitiesData,
  ): CancelablePromise<CitiesWithDetailsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/locations/cities/nearby",
      query: {
        latitude: data.latitude,
        longitude: data.longitude,
        radius_km: data.radius_km,
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create City
   * Create new city (Admin only).
   * @param data The data for the request.
   * @param data.requestBody
   * @returns CityPublic Successful Response
   * @throws ApiError
   */
  public static createCity(
    data: CitiesCreateCityData,
  ): CancelablePromise<CityPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/locations/cities",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update City
   * Update city (Admin only).
   * @param data The data for the request.
   * @param data.city_id
   * @param data.requestBody
   * @returns CityPublic Successful Response
   * @throws ApiError
   */
  public static updateCity(
    data: CitiesUpdateCityData,
  ): CancelablePromise<CityPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/locations/cities/{city_id}".replace(
        "{city_id}",
        encodeURIComponent(String(data.city_id)),
      ),
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "City not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete City
   * Delete city (Admin only).
   * @param data The data for the request.
   * @param data.city_id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteCity(
    data: CitiesDeleteCityData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/locations/cities/{city_id}".replace(
        "{city_id}",
        encodeURIComponent(String(data.city_id)),
      ),
      errors: {
        404: "City not found",
        422: "Validation Error",
      },
    })
  }
}

export class LocationsService {
  /**
   * Get Bulk Location Data
   * Get comprehensive location data.
   * @param data The data for the request.
   * @param data.country_codes
   * @returns LocationBulkData Successful Response
   * @throws ApiError
   */
  public static getBulkLocationData(
    data: LocationsGetBulkData = {},
  ): CancelablePromise<LocationBulkData> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/locations/bulk",
      query: {
        country_codes: data.country_codes,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}
