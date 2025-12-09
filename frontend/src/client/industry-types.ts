// Industry Types - API types for industry types endpoint

export interface IndustryTypeCreate {
  name: string
  description?: string | null
  code: string
  is_active?: boolean
}

export interface IndustryTypeUpdate {
  name?: string
  description?: string | null
  code?: string
  is_active?: boolean
}

export interface IndustryTypePublic extends IndustryTypeCreate {
  id: string
}

// API Data Types
export interface IndustryTypesPublic {
  data: IndustryTypePublic[]
  count: number
}

// API Request Data Types
export interface IndustryTypesReadIndustryTypesData {
  skip?: number
  limit?: number
  active_only?: boolean
}

export interface IndustryTypesCreateIndustryTypeData {
  requestBody: IndustryTypeCreate
}

export interface IndustryTypesReadIndustryTypeData {
  id: string
}

export interface IndustryTypesUpdateIndustryTypeData {
  id: string
  requestBody: IndustryTypeUpdate
}

export interface IndustryTypesDeleteIndustryTypeData {
  id: string
}