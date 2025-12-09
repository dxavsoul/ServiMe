// Category types - API types for category endpoint

export interface CategoryCreate {
  name: string
  description?: string | null
  code: string
  is_active?: boolean
  requires_business_license?: boolean
  requires_tax_id?: boolean
  requires_professional_license?: boolean
  requires_incorporation_docs?: boolean
  requires_personal_id?: boolean
  min_employees?: number
  max_employees?: number
  sort_order?: number
}

export interface CategoryUpdate {
  name?: string
  description?: string | null
  code?: string
  is_active?: boolean
  requires_business_license?: boolean
  requires_tax_id?: boolean
  requires_professional_license?: boolean
  requires_incorporation_docs?: boolean
  requires_personal_id?: boolean
  min_employees?: number
  max_employees?: number
  sort_order?: number
}

export interface CategoryPublic extends CategoryCreate {
  id: string
}

export interface CategoryRequirements {
  requires_business_license: boolean
  requires_tax_id: boolean
  requires_professional_license: boolean
  requires_incorporation_docs: boolean
  requires_personal_id: boolean
  min_employees: number
  max_employees: number
}

// API Data Types
export interface CategoriesPublic {
  data: CategoryPublic[]
  count: number
}

// API Request Data Types
export interface CategoriesReadCategoriesData {
  skip?: number
  limit?: number
  active_only?: boolean
}

export interface CategoriesCreateCategoryData {
  requestBody: CategoryCreate
}

export interface CategoriesReadCategoryData {
  id: string
}

export interface CategoriesUpdateCategoryData {
  id: string
  requestBody: CategoryUpdate
}

export interface CategoriesDeleteCategoryData {
  id: string
}

export interface CategoriesReadCategoryRequirementsData {
  category_id: string
}