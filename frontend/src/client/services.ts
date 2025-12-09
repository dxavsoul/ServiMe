// Services - will be replaced by generated types when backend API is available

export interface ServiceCreate {
  name: string
  description?: string | null
  picture_url?: string | null
  price: string // Decimal as string
  duration_minutes: number
  is_active?: boolean
  has_promotion?: boolean
  promotion_description?: string | null
  promotion_discount_percentage?: string | null // Decimal as string
  promotion_start_date?: string | null // Date as string (YYYY-MM-DD)
  promotion_end_date?: string | null // Date as string (YYYY-MM-DD)
  department_id: string
  service_type_id: string
}

export interface ServiceUpdate {
  name?: string
  description?: string | null
  picture_url?: string | null
  price?: string
  duration_minutes?: number
  is_active?: boolean
  has_promotion?: boolean
  promotion_description?: string | null
  promotion_discount_percentage?: string | null
  promotion_start_date?: string | null
  promotion_end_date?: string | null
  department_id?: string
  service_type_id?: string
}

export interface ServicePublic extends ServiceCreate {
  id: string
  created_by?: string
  created_at?: string
  updated_at?: string
  // Include department details when fetched with relations
  department_name?: string
  department?: {
    id: string
    name: string
    branch_id: string
  }
  // Include service type details when fetched with relations
  service_type_name?: string
  service_type?: {
    id: string
    name: string
    picture_url?: string | null
  }
}

// API Data Types
export interface ServicesPublic {
  data: ServicePublic[]
  count: number
}

// API Request Data Types
export interface ServicesReadServicesData {
  skip?: number
  limit?: number
}

export interface ServicesCreateServiceData {
  requestBody: ServiceCreate
}

export interface ServicesReadServiceData {
  id: string
}

export interface ServicesUpdateServiceData {
  id: string
  requestBody: ServiceUpdate
}

export interface ServicesDeleteServiceData {
  id: string
}

// Department-specific service requests
export interface ServicesReadServicesByDepartmentData {
  department_id: string
  skip?: number
  limit?: number
}

// Service type-specific service requests
export interface ServicesReadServicesByServiceTypeData {
  service_type_id: string
  skip?: number
  limit?: number
}

// Promotion services requests
export interface ServicesReadPromotionsData {
  skip?: number
  limit?: number
}
