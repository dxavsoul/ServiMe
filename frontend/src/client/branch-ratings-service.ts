import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { 
  RatingStatistics, 
  BranchWithRatings, 
  RatingResponse, 
  AdminResponseRequest, 
  RatingsListResponse,
  RatingFilters 
} from "@/types/ratings"

export class BranchRatingsService {
  /**
   * Get all ratings for a specific branch (Admin view)
   * @param branchId UUID of the branch
   * @param filters Optional filtering parameters
   * @returns RatingsListResponse Successful Response
   * @throws ApiError
   */
  public static getBranchRatings(
    branchId: string, 
    filters: RatingFilters = {}
  ): CancelablePromise<RatingsListResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: `/api/v1/branches/${branchId}/ratings`,
      query: {
        skip: filters.skip,
        limit: filters.limit,
      },
      errors: {
        403: "Insufficient Permissions",
        404: "Branch not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Respond to a customer rating
   * @param branchId UUID of the branch
   * @param ratingId UUID of the rating to respond to
   * @param response Admin response data
   * @returns RatingResponse Successful Response
   * @throws ApiError
   */
  public static respondToRating(
    branchId: string,
    ratingId: string,
    response: AdminResponseRequest
  ): CancelablePromise<RatingResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: `/api/v1/branches/${branchId}/ratings/${ratingId}/respond`,
      body: response,
      errors: {
        400: "Bad Request",
        403: "Insufficient Permissions",
        404: "Rating not found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete a rating (SuperAdmin only)
   * @param branchId UUID of the branch
   * @param ratingId UUID of the rating to delete
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteRating(
    branchId: string,
    ratingId: string
  ): CancelablePromise<{ message: string }> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: `/api/v1/branches/${branchId}/ratings/${ratingId}`,
      errors: {
        400: "Bad Request",
        403: "Only SuperAdmin can delete ratings",
        404: "Rating not found",
      },
    })
  }

  /**
   * Get branch details with rating statistics
   * @param branchId UUID of the branch
   * @returns BranchWithRatings Successful Response
   * @throws ApiError
   */
  public static getBranchWithRatings(branchId: string): CancelablePromise<BranchWithRatings> {
    return __request(OpenAPI, {
      method: "GET",
      url: `/api/v1/branches/${branchId}/with-ratings`,
      errors: {
        403: "Insufficient Permissions",
        404: "Branch not found",
      },
    })
  }

  /**
   * Get rating statistics for multiple branches
   * @param branchIds Array of branch UUIDs
   * @returns Record<string, RatingStatistics> Successful Response
   * @throws ApiError
   */
  public static getBranchesRatingStats(branchIds: string[]): CancelablePromise<Record<string, RatingStatistics>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/branches/rating-stats",
      query: {
        branch_ids: branchIds,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}
