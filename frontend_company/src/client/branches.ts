// Branch types - Updated to match new API specification

import type { CityPublic } from './cities'

export interface BranchCreate {
  name: string
  company_id: string // Required: Branch must belong to a company
  code?: string | null
  address?: string | null
  postal_code?: string | null
  city_id?: string | null // 🆕 City reference (Ecuador cities)
  latitude?: number | null // 🆕 Specific GPS coordinates
  longitude?: number | null // 🆕 Specific GPS coordinates
  phone?: string | null
  email?: string | null
  manager_name?: string | null
  is_active?: boolean
}

export interface BranchPublic extends BranchCreate {
  id: string
  created_by: string
}

export interface BranchWithLocationPublic extends BranchPublic {
  location_city: CityPublic
}

export interface BranchesWithCompanyPublic {
  data: Array<BranchPublic & { company_name: string }>
  count: number
}

export interface BranchesWithLocationPublic {
  data: Array<BranchWithLocationPublic>
  count: number
}

export interface BranchesWithDetailsPublic {
  data: Array<BranchWithLocationPublic & { company_name: string }>
  count: number
}

export interface BranchWithDetailsPublic extends BranchWithLocationPublic {
  company_name: string
}

export interface BranchUpdate extends Partial<BranchCreate> {}

export interface BranchesPublic {
  data: Array<BranchPublic>
  count: number
}

// API Data types following the same pattern as other services
export interface BranchesReadBranchesData {
  limit?: number
  skip?: number
  company_id?: string // Optional: Filter branches by company
}

export interface BranchesCreateBranchData {
  requestBody: BranchCreate
}

export interface BranchesReadBranchData {
  id: string
}

export interface BranchesUpdateBranchData {
  id: string
  requestBody: BranchUpdate
}

export interface BranchesDeleteBranchData {
  id: string
}

export interface BranchesReadBranchesByCompanyData {
  company_id: string
  limit?: number
  skip?: number
}
