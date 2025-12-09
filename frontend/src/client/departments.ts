// Department types - will be replaced by generated types when backend API is available

export type DayOfWeek = 
  | "monday" 
  | "tuesday" 
  | "wednesday" 
  | "thursday" 
  | "friday" 
  | "saturday" 
  | "sunday"

export interface DepartmentHourCreate {
  day_of_week: DayOfWeek
  open_time: string | null
  close_time: string | null
  is_closed: boolean
  department_id: string // Required by API
}

export interface DepartmentHourPublic extends DepartmentHourCreate {
  id: string
  department_id: string
}

export interface DepartmentCreate {
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
}

export interface DepartmentPublic extends DepartmentCreate {
  id: string
  created_by: string
}

export interface DepartmentWithHours extends DepartmentPublic {
  hours: Array<DepartmentHourPublic>
}

export interface DepartmentUpdate extends Partial<DepartmentCreate> {}

export interface DepartmentHourUpdate {
  day_of_week?: DayOfWeek | null
  open_time?: string | null
  close_time?: string | null
  is_closed?: boolean
  department_id?: string | null
}

export interface DepartmentsPublic {
  data: Array<DepartmentPublic>
  count: number
}

export interface DepartmentHoursPublic {
  data: Array<DepartmentHourPublic>
  count: number
}

// API Data types following the same pattern as existing services
export interface DepartmentsReadDepartmentsData {
  limit?: number
  skip?: number
  branch_id?: string
}

export interface DepartmentsCreateDepartmentData {
  requestBody: DepartmentCreate
}

export interface DepartmentsReadDepartmentData {
  id: string
}

export interface DepartmentsReadDepartmentWithHoursData {
  id: string
}

export interface DepartmentsUpdateDepartmentData {
  id: string
  requestBody: DepartmentUpdate
}

export interface DepartmentsDeleteDepartmentData {
  id: string
}

export interface DepartmentHoursCreateSingleData {
  department_id: string
  requestBody: DepartmentHourCreate
}

export interface DepartmentHoursCreateWeeklyData {
  department_id: string
  requestBody: Array<DepartmentHourCreate>
}

export interface DepartmentHoursReadData {
  department_id: string
}

export interface DepartmentHoursUpdateData {
  id: string
  requestBody: DepartmentHourUpdate
}

export interface DepartmentHoursDeleteData {
  id: string
}
