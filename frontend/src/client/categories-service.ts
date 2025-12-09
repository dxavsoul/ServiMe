// Categories Service - API service for categories endpoint

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  CategoriesReadCategoriesData,
  CategoriesCreateCategoryData,
  CategoriesReadCategoryData,
  CategoriesUpdateCategoryData,
  CategoriesDeleteCategoryData,
  CategoriesReadCategoryRequirementsData,
  CategoriesPublic,
  CategoryPublic,
  CategoryRequirements,
} from "./categories"

export class CategoriesService {
  /**
   * Read Categories
   * Retrieve categories.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.active_only
   * @returns CategoriesPublic Successful Response
   * @throws ApiError
   */
  public static readCategories(
    data: CategoriesReadCategoriesData = {},
  ): CancelablePromise<CategoriesPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/categories/",
      query: {
        skip: data.skip,
        limit: data.limit,
        active_only: data.active_only,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Category
   * Create new category.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns CategoryPublic Successful Response
   * @throws ApiError
   */
  public static createCategory(
    data: CategoriesCreateCategoryData,
  ): CancelablePromise<CategoryPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/categories/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Category
   * Get category by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns CategoryPublic Successful Response
   * @throws ApiError
   */
  public static readCategory(
    data: CategoriesReadCategoryData,
  ): CancelablePromise<CategoryPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/categories/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Category
   * Update a category.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns CategoryPublic Successful Response
   * @throws ApiError
   */
  public static updateCategory(
    data: CategoriesUpdateCategoryData,
  ): CancelablePromise<CategoryPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/categories/{id}",
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
   * Delete Category
   * Delete a category.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteCategory(
    data: CategoriesDeleteCategoryData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/categories/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Category Requirements
   * Get category requirements by category ID.
   * @param data The data for the request.
   * @param data.category_id
   * @returns CategoryRequirements Successful Response
   * @throws ApiError
   */
  public static readCategoryRequirements(
    data: CategoriesReadCategoryRequirementsData,
  ): CancelablePromise<CategoryRequirements> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/categories/{category_id}/requirements",
      path: {
        category_id: data.category_id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}