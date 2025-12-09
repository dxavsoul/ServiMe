// Countries Service - Location management module
// Structured to match the generated service pattern

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  CountriesReadCountriesData,
  CountriesCreateCountryData,
  CountriesReadCountryData,
  CountriesUpdateCountryData,
  CountriesDeleteCountryData,
  CountriesPublic,
  CountryPublic,
} from "./countries"

export class CountriesService {
  /**
   * Read Countries
   * Retrieve all countries.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.search
   * @param data.active_only
   * @returns CountriesPublic Successful Response
   * @throws ApiError
   */
  public static readCountries(
    data: CountriesReadCountriesData = {},
  ): CancelablePromise<CountriesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/locations/countries",
      query: {
        skip: data.skip,
        limit: data.limit,
        search: data.search,
        active_only: data.active_only,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Country
   * Create new country (Admin only).
   * @param data The data for the request.
   * @param data.requestBody
   * @returns CountryPublic Successful Response
   * @throws ApiError
   */
  public static createCountry(
    data: CountriesCreateCountryData,
  ): CancelablePromise<CountryPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/locations/countries",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Country
   * Get country by ISO code.
   * @param data The data for the request.
   * @param data.country_code
   * @returns CountryPublic Successful Response
   * @throws ApiError
   */
  public static readCountry(
    data: CountriesReadCountryData,
  ): CancelablePromise<CountryPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/locations/countries/{country_code}".replace(
        "{country_code}",
        encodeURIComponent(String(data.country_code)),
      ),
      errors: {
        404: "Country not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Country
   * Update country (Admin only).
   * @param data The data for the request.
   * @param data.country_id
   * @param data.requestBody
   * @returns CountryPublic Successful Response
   * @throws ApiError
   */
  public static updateCountry(
    data: CountriesUpdateCountryData,
  ): CancelablePromise<CountryPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/locations/countries/{country_id}".replace(
        "{country_id}",
        encodeURIComponent(String(data.country_id)),
      ),
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Country not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Country
   * Delete country (Admin only).
   * @param data The data for the request.
   * @param data.country_id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteCountry(
    data: CountriesDeleteCountryData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/locations/countries/{country_id}".replace(
        "{country_id}",
        encodeURIComponent(String(data.country_id)),
      ),
      errors: {
        404: "Country not found",
        422: "Validation Error",
      },
    })
  }
}
