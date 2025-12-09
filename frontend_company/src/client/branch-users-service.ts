import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

import type {
  BranchUserPublic,
  BranchUsersPublic,
  RemoveUserResponse,
  BranchUsersGetBranchUsersData,
  BranchUsersAssignUserData,
  BranchUsersUpdateRoleData,
  BranchUsersRemoveUserData,
} from "./branch-users"

export class BranchUsersService {
  /**
   * Get branch users
   * Retrieve all users assigned to a specific branch
   */
  public static getBranchUsers(
    data: BranchUsersGetBranchUsersData,
  ): CancelablePromise<BranchUsersPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branch-users/{branch_id}/users",
      path: {
        branch_id: data.branch_id,
      },
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }

  /**
   * Assign user to branch
   * Assign a user to a branch with a specific role
   */
  public static assignUser(
    data: BranchUsersAssignUserData,
  ): CancelablePromise<BranchUserPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/branch-users/{branch_id}/assign",
      path: {
        branch_id: data.branch_id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    })
  }

  /**
   * Update user role
   * Update the role of a user assigned to a branch
   */
  public static updateUserRole(
    data: BranchUsersUpdateRoleData,
  ): CancelablePromise<BranchUserPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/branch-users/{branch_id}/update-role/{user_id}",
      path: {
        branch_id: data.branch_id,
        user_id: data.user_id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    })
  }

  /**
   * Remove user from branch
   * Remove a user assignment from a branch
   */
  public static removeUser(
    data: BranchUsersRemoveUserData,
  ): CancelablePromise<RemoveUserResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/branch-users/{branch_id}/remove/{user_id}",
      path: {
        branch_id: data.branch_id,
        user_id: data.user_id,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
}
