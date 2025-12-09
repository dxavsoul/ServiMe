// Customer types - Based on Customer Management API specification

export interface CustomerBase {
  email: string
  full_name: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  is_active?: boolean
}

export interface CustomerCreate extends CustomerBase {
  password: string
}

export interface CustomerUpdate extends Partial<CustomerBase> {
  password?: string
}

export interface CustomerUpdateMe extends Omit<Partial<CustomerBase>, 'email' | 'is_active'> {}

export interface CustomerPublic extends CustomerBase {
  id: string
}

export interface CustomersPublic {
  data: Array<CustomerPublic>
  count: number
}

export interface CustomerStats {
  total_customers: number
  active_customers: number
  inactive_customers: number
  customers_with_location: number
}

// API Data types for request parameters
export interface CustomersReadCustomersData {
  limit?: number
  skip?: number
}

export interface CustomersCreateCustomerData {
  requestBody: CustomerCreate
}

export interface CustomersReadCustomerData {
  customer_id: string
}

export interface CustomersUpdateCustomerData {
  customer_id: string
  requestBody: CustomerUpdate
}

export interface CustomersDeleteCustomerData {
  customer_id: string
}

export interface CustomersSearchCustomersData {
  q?: string
  skip?: number
  limit?: number
}

export interface CustomersGetNearbyCustomersData {
  latitude: number
  longitude: number
  radius_km?: number
  skip?: number
  limit?: number
}

export interface CustomersGetStatsData {}
