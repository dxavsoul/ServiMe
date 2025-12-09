// Departments Service - structured to match the generated service pattern
// This will be replaced by auto-generated code when the backend API is available

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { Message } from "./types.gen"
import type {
  DepartmentsReadDepartmentsData,
  DepartmentsCreateDepartmentData,
  DepartmentsReadDepartmentData,
  DepartmentsReadDepartmentWithHoursData,
  DepartmentsUpdateDepartmentData,
  DepartmentsDeleteDepartmentData,
  DepartmentHoursCreateSingleData,
  DepartmentHoursCreateWeeklyData,
  DepartmentHoursReadData,
  DepartmentHoursUpdateData,
  DepartmentHoursDeleteData,
  DepartmentsPublic,
  DepartmentPublic,
  DepartmentWithHours,
  DepartmentHoursPublic,
  DepartmentHourPublic,
  DepartmentHourUpdate,
} from "./departments"

export class DepartmentsService {
  /**
   * Read Departments
   * Retrieve departments.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @param data.branch_id
   * @returns DepartmentsPublic Successful Response
   * @throws ApiError
   */
  public static readDepartments(
    data: DepartmentsReadDepartmentsData = {},
  ): CancelablePromise<DepartmentsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/departments/",
      query: {
        skip: data.skip,
        limit: data.limit,
        branch_id: data.branch_id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Department
   * Create new department.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns DepartmentPublic Successful Response
   * @throws ApiError
   */
  public static createDepartment(
    data: DepartmentsCreateDepartmentData,
  ): CancelablePromise<DepartmentPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/departments/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Department
   * Get department by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns DepartmentPublic Successful Response
   * @throws ApiError
   */
  public static readDepartment(
    data: DepartmentsReadDepartmentData,
  ): CancelablePromise<DepartmentPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/departments/{id}",
      path: {
        id: data.id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Department With Hours
   * Get department by ID with hours.
   * @param data The data for the request.
   * @param data.id
   * @returns DepartmentWithHours Successful Response
   * @throws ApiError
   */
  public static readDepartmentWithHours(
    data: DepartmentsReadDepartmentWithHoursData,
  ): CancelablePromise<DepartmentWithHours> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/departments/{id}/with-hours",
      path: {
        id: data.id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Department
   * Update a department.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns DepartmentPublic Successful Response
   * @throws ApiError
   */
  public static updateDepartment(
    data: DepartmentsUpdateDepartmentData,
  ): CancelablePromise<DepartmentPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/departments/{id}",
      path: {
        id: data.id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Department
   * Delete a department.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteDepartment(
    data: DepartmentsDeleteDepartmentData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/departments/{id}",
      path: {
        id: data.id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }
}

export class DepartmentHoursService {
  /**
   * Create Single Day Hours
   * Create department hours for a single day.
   * @param data The data for the request.
   * @param data.department_id
   * @param data.requestBody
   * @returns DepartmentHourPublic Successful Response
   * @throws ApiError
   */
  public static createSingleDayHours(
    data: DepartmentHoursCreateSingleData,
  ): CancelablePromise<DepartmentHourPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/department-hours/department/{department_id}",
      path: {
        department_id: data.department_id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Weekly Schedule
   * Create department hours for a full week.
   * @param data The data for the request.
   * @param data.department_id
   * @param data.requestBody
   * @returns Array<DepartmentHourPublic> Successful Response
   * @throws ApiError
   */
  public static createWeeklySchedule(
    data: DepartmentHoursCreateWeeklyData,
  ): CancelablePromise<Array<DepartmentHourPublic>> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/department-hours/department/{department_id}/weekly",
      path: {
        department_id: data.department_id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Department Hours
   * Get department hours by department ID.
   * @param data The data for the request.
   * @param data.department_id
   * @returns DepartmentHoursPublic Successful Response
   * @throws ApiError
   */
  public static readDepartmentHours(
    data: DepartmentHoursReadData,
  ): CancelablePromise<DepartmentHoursPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/department-hours/department/{department_id}",
      path: {
        department_id: data.department_id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Department Hours
   * Update department hours.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns DepartmentHourPublic Successful Response
   * @throws ApiError
   */
  public static updateDepartmentHours(
    data: DepartmentHoursUpdateData,
  ): CancelablePromise<DepartmentHourPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/department-hours/{id}",
      path: {
        id: data.id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Department Hours
   * Delete department hours.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteDepartmentHours(
    data: DepartmentHoursDeleteData,
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/department-hours/{id}",
      path: {
        id: data.id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Day Hours
   * Update department hours for a specific day.
   * @param data The data for the request.
   * @param data.department_id
   * @param data.day_of_week
   * @param data.requestBody
   * @returns DepartmentHourPublic Successful Response
   * @throws ApiError
   */
  public static updateDayHours(
    data: {
      department_id: string
      day_of_week: string
      requestBody: DepartmentHourUpdate
    },
  ): CancelablePromise<DepartmentHourPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/department-hours/department/{department_id}/day/{day_of_week}",
      path: {
        department_id: data.department_id,
        day_of_week: data.day_of_week,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Day Hours
   * Delete department hours for a specific day.
   * @param data The data for the request.
   * @param data.department_id
   * @param data.day_of_week
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteDayHours(
    data: {
      department_id: string
      day_of_week: string
    },
  ): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/department-hours/department/{department_id}/day/{day_of_week}",
      path: {
        department_id: data.department_id,
        day_of_week: data.day_of_week,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  }
}
