// Enhanced User Management Service

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type {
  UserApprovalStatus,
  EnhancedUserPublic,
  EnhancedUserDetailed,
  EnhancedUsersList,
  EnhancedUserCreate,
  EnhancedUserUpdate,
  UserProfileUpdate,
  PasswordChangeRequest,
  PasswordChangeResponse,
  UsersListParams,
  UserDeletionResponse,
} from "./enhanced-users"

export class EnhancedUsersService {
  // =============================================================================
  // USER APPROVAL STATUS
  // =============================================================================

  /**
   * Get User Approval Status
   * Check current user's approval status and assigned resources
   * @returns UserApprovalStatus Current user's approval status
   * @throws ApiError
   */
  public static getUserApprovalStatus(): CancelablePromise<UserApprovalStatus> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/me/approval-status",
      errors: {
        401: "Unauthorized - Invalid token",
        403: "Forbidden - Access denied",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // CURRENT USER PROFILE MANAGEMENT
  // =============================================================================

  /**
   * Get Current User Profile
   * Get current user's detailed profile information
   * @returns EnhancedUserPublic Current user's profile
   * @throws ApiError
   */
  public static getCurrentUserProfile(): CancelablePromise<EnhancedUserPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/me",
      errors: {
        401: "Unauthorized - Invalid token",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Current User Profile
   * Update current user's profile information
   * @param requestBody User profile update data
   * @returns EnhancedUserPublic Updated user profile
   * @throws ApiError
   */
  public static updateCurrentUserProfile(
    requestBody: UserProfileUpdate,
  ): CancelablePromise<EnhancedUserPublic> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/users/me",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: "Bad Request - Invalid data",
        401: "Unauthorized - Invalid token",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // PASSWORD MANAGEMENT
  // =============================================================================

  /**
   * Change User Password
   * Change current user's password
   * @param requestBody Password change request data
   * @returns PasswordChangeResponse Password change confirmation
   * @throws ApiError
   */
  public static changePassword(
    requestBody: PasswordChangeRequest,
  ): CancelablePromise<PasswordChangeResponse> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/users/me/password",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: "Bad Request - Invalid current password",
        401: "Unauthorized - Invalid token",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // ADMIN USER MANAGEMENT (SuperAdmin Only)
  // =============================================================================

  /**
   * List All Users
   * Get paginated list of all users (SuperAdmin only)
   * @param params Query parameters for filtering and pagination
   * @returns EnhancedUsersList List of users with pagination info
   * @throws ApiError
   */
  public static listAllUsers(
    params: UsersListParams = {},
  ): CancelablePromise<EnhancedUsersList> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/",
      query: {
        skip: params.skip,
        limit: params.limit,
        is_active: params.is_active,
        is_superuser: params.is_superuser,
        search: params.search,
      },
      errors: {
        401: "Unauthorized - Invalid token",
        403: "Forbidden - SuperAdmin access required",
        422: "Validation Error",
      },
    })
  }

  /**
   * Create New User
   * Create a new user (SuperAdmin only)
   * @param requestBody User creation data
   * @returns EnhancedUserPublic Created user data
   * @throws ApiError
   */
  public static createUser(
    requestBody: EnhancedUserCreate,
  ): CancelablePromise<EnhancedUserPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/users/",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: "Bad Request - Email already exists",
        401: "Unauthorized - Invalid token",
        403: "Forbidden - SuperAdmin access required",
        422: "Validation Error",
      },
    })
  }

  /**
   * Get User By ID
   * Get detailed information about a specific user (SuperAdmin only)
   * @param userId User ID to retrieve
   * @returns EnhancedUserDetailed Detailed user information
   * @throws ApiError
   */
  public static getUserById(
    userId: string,
  ): CancelablePromise<EnhancedUserDetailed> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: userId,
      },
      errors: {
        401: "Unauthorized - Invalid token",
        403: "Forbidden - SuperAdmin access required",
        404: "User not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update User
   * Update a specific user (SuperAdmin only)
   * @param userId User ID to update
   * @param requestBody User update data
   * @returns EnhancedUserPublic Updated user data
   * @throws ApiError
   */
  public static updateUser(
    userId: string,
    requestBody: EnhancedUserUpdate,
  ): CancelablePromise<EnhancedUserPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: userId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: "Bad Request - Invalid data or email conflict",
        401: "Unauthorized - Invalid token",
        403: "Forbidden - SuperAdmin access required",
        404: "User not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete User
   * Delete a specific user (SuperAdmin only)
   * @param userId User ID to delete
   * @returns UserDeletionResponse Deletion confirmation
   * @throws ApiError
   */
  public static deleteUser(
    userId: string,
  ): CancelablePromise<UserDeletionResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: userId,
      },
      errors: {
        401: "Unauthorized - Invalid token",
        403: "Forbidden - SuperAdmin access required",
        404: "User not found",
        409: "Conflict - Cannot delete user with dependencies",
        422: "Validation Error",
      },
    })
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if current user is approved
   * Quick check for user approval status
   * @returns Promise<boolean> True if user is approved
   */
  public static async isCurrentUserApproved(): Promise<boolean> {
    try {
      const status = await this.getUserApprovalStatus()
      return status.approved
    } catch (error) {
      return false
    }
  }

  /**
   * Get current user's accessible resources
   * Get list of companies and branches the current user has access to
   * @returns Promise<{companies: string[], branches: string[]}> Accessible resources
   */
  public static async getCurrentUserResources(): Promise<{
    companies: string[]
    branches: string[]
  }> {
    try {
      const status = await this.getUserApprovalStatus()
      return {
        companies: status.assigned_companies,
        branches: status.assigned_branches,
      }
    } catch (error) {
      return { companies: [], branches: [] }
    }
  }
}
