// Company types - Updated to match new API specification

export interface CompanyCreate {
  name: string
  description?: string | null
  industry_type_id?: string | null
  category_id?: string | null
  website?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city_id?: string | null
  is_active?: boolean
}

export interface CompanyPublic extends CompanyCreate {
  id: string
  logo_image_key?: string | null
  logo_image_url?: string | null
  created_by: string
}

export interface CompanyUpdate extends Partial<CompanyCreate> {}

export interface CompanyWithLocationPublic extends CompanyPublic {
  city_name?: string | null
  state_name?: string | null
  country_name?: string | null
  city_coordinates?: {
    latitude: number
    longitude: number
  } | null
}

export interface CompaniesPublic {
  data: Array<CompanyPublic>
  count: number
}

export interface CompaniesWithLocationPublic {
  data: Array<CompanyWithLocationPublic>
  count: number
}

// API Data types following the same pattern as other services
export interface CompaniesReadCompaniesData {
  limit?: number
  skip?: number
}

export interface CompaniesReadMyCompaniesData {
  limit?: number
  skip?: number
}

export interface CompaniesReadCompaniesWithLocationData {
  limit?: number
  skip?: number
}

export interface CompaniesCreateCompanyData {
  requestBody: CompanyCreate
}

export interface CompaniesReadCompanyData {
  company_id: string
}

export interface CompaniesReadCompanyWithLocationData {
  company_id: string
}

export interface CompaniesUpdateCompanyData {
  company_id: string
  requestBody: CompanyUpdate
}

export interface CompaniesDeleteCompanyData {
  company_id: string
}
