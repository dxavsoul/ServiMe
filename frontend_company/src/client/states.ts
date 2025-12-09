// State types - Location management module
import type { CountryPublic } from './countries'

export interface StateCreate {
  name: string
  code: string
  country_id: string
  is_active: boolean
}

export interface StatePublic extends StateCreate {
  id: string
}

export interface StateWithCountryPublic extends StatePublic {
  country: CountryPublic
}

export interface StateUpdate extends Partial<StateCreate> {}

export interface StatesWithCountryPublic {
  data: Array<StateWithCountryPublic>
  count: number
}

// API Data types following the same pattern as other services
export interface StatesReadStatesData {
  limit?: number
  skip?: number
  country_id?: string
  country_code?: string
  search?: string
}

export interface StatesCreateStateData {
  requestBody: StateCreate
}

export interface StatesUpdateStateData {
  state_id: string
  requestBody: StateUpdate
}

export interface StatesDeleteStateData {
  state_id: string
}
