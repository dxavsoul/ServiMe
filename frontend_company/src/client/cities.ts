// City types - Location management module
import type { CountryPublic } from './countries'
import type { StatePublic } from './states'

export interface CityCreate {
  name: string
  country_id: string
  state_id: string
  latitude: number
  longitude: number
  population?: number | null
  is_active: boolean
}

export interface CityPublic extends CityCreate {
  id: string
}

export interface CityWithDetailsPublic extends CityPublic {
  country: CountryPublic
  state: StatePublic
}

export interface CityUpdate extends Partial<CityCreate> {}

export interface CitiesWithDetailsPublic {
  data: Array<CityWithDetailsPublic>
  count: number
}

// Bulk location data interface
export interface LocationBulkData {
  countries: Array<{
    id: string
    code: string
    name: string
  }>
  states: Array<{
    id: string
    code: string
    name: string
    country_id: string
  }>
  cities: Array<{
    id: string
    name: string
    state_id: string
    country_id: string
    latitude: number
    longitude: number
  }>
}

// API Data types following the same pattern as other services
export interface CitiesReadCitiesData {
  limit?: number
  skip?: number
  country_id?: string
  state_id?: string
  country_code?: string
  state_code?: string
  search?: string
  popular?: boolean
}

export interface CitiesReadNearbyCitiesData {
  latitude: number
  longitude: number
  radius_km?: number
  skip?: number
  limit?: number
}

export interface CitiesCreateCityData {
  requestBody: CityCreate
}

export interface CitiesUpdateCityData {
  city_id: string
  requestBody: CityUpdate
}

export interface CitiesDeleteCityData {
  city_id: string
}

export interface LocationsGetBulkData {
  country_codes?: string
}
