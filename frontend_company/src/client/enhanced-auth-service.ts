// Enhanced Authentication Service

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type {
  UserRegistration,
  UserRegistrationResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  FormLoginData,
} from "./enhanced-users"

export class EnhancedAuthService {
  // =============================================================================
  // USER REGISTRATION
  // =============================================================================

  /**
   * Register New User
   * Register a new user account
   * @param requestBody User registration data
   * @returns UserRegistrationResponse Registration result with approval status
   * @throws ApiError
   */
  public static registerUser(
    requestBody: UserRegistration,
  ): CancelablePromise<UserRegistrationResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/auth/register",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: "Bad Request - Email already exists or validation failed",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // USER AUTHENTICATION
  // =============================================================================

  /**
   * User Login (JSON)
   * Authenticate user and get access token (JSON format)
   * @param requestBody Login credentials
   * @returns LoginResponse Login result with tokens and user info
   * @throws ApiError
   */
  public static loginUser(
    requestBody: LoginRequest,
  ): CancelablePromise<LoginResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/auth/login",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: "Bad Request - Invalid credentials",
        401: "Unauthorized - Invalid username or password",
        403: "Forbidden - Account not approved or inactive",
        422: "Validation Error",
      },
    })
  }

  /**
   * User Login (Form Data)
   * Authenticate user and get access token (Form data format - OAuth2 compatible)
   * @param formData Login credentials as form data
   * @returns LoginResponse Login result with tokens and user info
   * @throws ApiError
   */
  public static loginUserForm(
    formData: FormLoginData,
  ): CancelablePromise<LoginResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/auth/login",
      formData: formData,
      mediaType: "application/x-www-form-urlencoded",
      errors: {
        400: "Bad Request - Invalid credentials",
        401: "Unauthorized - Invalid username or password",
        403: "Forbidden - Account not approved or inactive",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================

  /**
   * Refresh Access Token
   * Refresh access token using refresh token
   * @param requestBody Refresh token data
   * @returns RefreshTokenResponse New tokens
   * @throws ApiError
   */
  public static refreshToken(
    requestBody: RefreshTokenRequest,
  ): CancelablePromise<RefreshTokenResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/auth/refresh",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        401: "Unauthorized - Invalid or expired refresh token",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // USER LOGOUT
  // =============================================================================

  /**
   * User Logout
   * Logout user and invalidate tokens
   * @param requestBody Logout options (optional)
   * @returns LogoutResponse Logout confirmation
   * @throws ApiError
   */
  public static logoutUser(
    requestBody: LogoutRequest = {},
  ): CancelablePromise<LogoutResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/auth/logout",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        401: "Unauthorized - Invalid token",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if user is authenticated
   * Verify if the current token is valid
   * @returns Promise<boolean> True if authenticated
   */
  public static async isAuthenticated(): Promise<boolean> {
    try {
      // Use the existing test token endpoint
      await __request(OpenAPI, {
        method: "POST",
        url: "/api/v1/login/test-token",
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Auto-refresh token if needed
   * Automatically refresh the access token if it's expired but refresh token is valid
   * @param refreshToken The refresh token to use
   * @returns Promise<boolean> True if refresh was successful
   */
  public static async autoRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const response = await this.refreshToken({ refresh_token: refreshToken })
      
      // Update the OpenAPI configuration with the new token
      if (response.access_token) {
        OpenAPI.TOKEN = response.access_token
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Logout from all devices
   * Convenience method to logout from all devices
   * @returns Promise<LogoutResponse> Logout confirmation
   */
  public static logoutAllDevices(): CancelablePromise<LogoutResponse> {
    return this.logoutUser({ logout_all_devices: true })
  }

  /**
   * Set authentication token
   * Set the authentication token for API requests
   * @param token The access token
   */
  public static setAuthToken(token: string): void {
    OpenAPI.TOKEN = token
  }

  /**
   * Clear authentication token
   * Remove the authentication token from API requests
   */
  public static clearAuthToken(): void {
    OpenAPI.TOKEN = undefined
  }

  /**
   * Get current authentication token
   * Get the current authentication token
   * @returns string | undefined Current token
   */
  public static getCurrentToken(): string | undefined {
    const token = OpenAPI.TOKEN
    return typeof token === 'string' ? token : undefined
  }
}
