// Country types - Location management module

export interface CountryCreate {
  name: string
  code: string
  is_active: boolean
}

export interface CountryPublic extends CountryCreate {
  id: string
}

export interface CountryUpdate extends Partial<CountryCreate> {}

export interface CountriesPublic {
  data: Array<CountryPublic>
  count: number
}

// API Data types following the same pattern as other services
export interface CountriesReadCountriesData {
  limit?: number
  skip?: number
  search?: string
  active_only?: boolean
}

export interface CountriesCreateCountryData {
  requestBody: CountryCreate
}

export interface CountriesReadCountryData {
  country_code: string
}

export interface CountriesUpdateCountryData {
  country_id: string
  requestBody: CountryUpdate
}

export interface CountriesDeleteCountryData {
  country_id: string
}
