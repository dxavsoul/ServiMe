// Service Types - will be replaced by generated types when backend API is available

export interface ServiceTypeCreate {
  name: string
  description?: string | null
  picture_url?: string | null
  is_active?: boolean
}

export interface ServiceTypeUpdate {
  name?: string
  description?: string | null
  picture_url?: string | null
  is_active?: boolean
}

export interface ServiceTypePublic extends ServiceTypeCreate {
  id: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

// API Data Types
export interface ServiceTypesPublic {
  data: ServiceTypePublic[]
  count: number
}

// API Request Data Types
export interface ServiceTypesReadServiceTypesData {
  skip?: number
  limit?: number
}

export interface ServiceTypesCreateServiceTypeData {
  requestBody: ServiceTypeCreate
}

export interface ServiceTypesReadServiceTypeData {
  id: string
}

export interface ServiceTypesUpdateServiceTypeData {
  id: string
  requestBody: ServiceTypeUpdate
}

export interface ServiceTypesDeleteServiceTypeData {
  id: string
}
