// Service Requests - API types and interfaces

export interface ServiceRequestCreate {
  service_id: string
  description: string
  preferred_date?: string // Date as string (YYYY-MM-DD)
  preferred_time?: string // Time as string (HH:MM)
  urgent?: boolean
  customer_latitude?: number
  customer_longitude?: number
}

export interface ServiceRequestUpdate {
  service_id?: string
  description?: string
  preferred_date?: string // Date as string (YYYY-MM-DD)
  preferred_time?: string // Time as string (HH:MM)
  urgent?: boolean
  customer_latitude?: number
  customer_longitude?: number
  status?: string // Admin can change status
}

export interface ServiceRequestPublic {
  id: string
  service_id: string
  customer_id: string
  branch_id?: string | null
  description: string
  preferred_date?: string | null
  preferred_time?: string | null
  urgent: boolean
  customer_latitude?: number | null
  customer_longitude?: number | null
  status: string
  created_at: string
  updated_at: string
  
  // Populated relations
  service?: {
    id: string
    name: string
    description?: string | null
    price: string
    duration_minutes: number
  }
  customer?: {
    id: string
    email: string
    full_name: string
    phone_number?: string | null
  }
  branch?: {
    id: string
    name: string
    address: string
    phone_number?: string | null
  }
}

export interface ServiceRequestsPublic {
  data: ServiceRequestPublic[]
  count: number
}

// Request data types for API endpoints
export interface ServiceRequestsReadServiceRequestsData {
  skip?: number
  limit?: number
  status?: string
  customer_id?: string
  service_id?: string
  branch_id?: string
}

export interface ServiceRequestsUpdateServiceRequestData {
  request_id: string
  requestBody: ServiceRequestUpdate
}

export interface ServiceRequestsAssignBranchData {
  request_id: string
  branch_id: string
}
