import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { VStack } from "@chakra-ui/react"
import { CountriesService, StatesService, CitiesService } from "../../client"
import { Field } from "../ui/field"

interface LocationSelectorProps {
  countryId?: string | null
  stateId?: string | null
  cityId?: string | null
  onCountryChange: (countryId: string | null) => void
  onStateChange: (stateId: string | null) => void
  onCityChange: (cityId: string | null) => void
  required?: boolean
  errorTexts?: {
    country?: string
    state?: string
    city?: string
  }
}

const LocationSelector = ({
  countryId,
  stateId,
  cityId,
  onCountryChange,
  onStateChange,
  onCityChange,
  required = false,
  errorTexts = {},
}: LocationSelectorProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(countryId || "")
  const [selectedState, setSelectedState] = useState<string>(stateId || "")
  const [selectedCity, setSelectedCity] = useState<string>(cityId || "")

  // Fetch countries
  const { data: countriesData, isLoading: loadingCountries } = useQuery({
    queryKey: ["countries", "active"],
    queryFn: () => CountriesService.readCountries({ active_only: true, limit: 1000 }),
  })

  // Fetch states when country is selected
  const { data: statesData, isLoading: loadingStates } = useQuery({
    queryKey: ["states", selectedCountry],
    queryFn: () => StatesService.readStates({ limit: 1000, country_id: selectedCountry }),
    enabled: !!selectedCountry,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch cities when state is selected
  const { data: citiesData, isLoading: loadingCities } = useQuery({
    queryKey: ["cities", selectedState],
    queryFn: () => CitiesService.readCities({ limit: 1000, state_id: selectedState }),
    enabled: !!selectedState,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Extract data arrays (like in EditBranch)
  const countries = countriesData?.data || []
  const states = selectedCountry ? (statesData?.data || []) : []
  const cities = selectedState ? (citiesData?.data || []) : []

  // Update state when country changes
  const handleCountryChange = (newCountryId: string | null) => {
    const countryValue = newCountryId || ""
    setSelectedCountry(countryValue)
    setSelectedState("") // Reset state when country changes
    setSelectedCity("") // Reset city when country changes
    onCountryChange(newCountryId)
    onStateChange(null)
    onCityChange(null)
  }

  // Update city when state changes
  const handleStateChange = (newStateId: string | null) => {
    const stateValue = newStateId || ""
    setSelectedState(stateValue)
    setSelectedCity("") // Reset city when state changes
    onStateChange(newStateId)
    onCityChange(null)
  }

  // Update city when city changes
  const handleCityChange = (newCityId: string | null) => {
    const cityValue = newCityId || ""
    setSelectedCity(cityValue)
    onCityChange(newCityId)
  }

  // Sync external changes
  useEffect(() => {
    setSelectedCountry(countryId || "")
  }, [countryId])

  useEffect(() => {
    setSelectedState(stateId || "")
  }, [stateId])

  useEffect(() => {
    setSelectedCity(cityId || "")
  }, [cityId])

  return (
    <VStack gap={4} align="stretch">
      <Field
        required={required}
        invalid={!!errorTexts.country}
        errorText={errorTexts.country}
        label="Country"
      >
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value || null)}
          disabled={loadingCountries}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
          }}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        required={required}
        invalid={!!errorTexts.state}
        errorText={errorTexts.state}
        label="State/Province"
      >
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value || null)}
          disabled={!selectedCountry || loadingStates}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: selectedCountry ? 'white' : '#F7FAFC',
          }}
        >
          <option value="">
            {!selectedCountry ? "Select a country first" : "Select a state/province"}
          </option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        required={required}
        invalid={!!errorTexts.city}
        errorText={errorTexts.city}
        label="City"
      >
        <select
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value || null)}
          disabled={!selectedState || loadingCities}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: selectedState ? 'white' : '#F7FAFC',
          }}
        >
          <option value="">
            {!selectedState ? "Select a state/province first" : "Select a city"}
          </option>
          {cities
            .filter((city) => city.state_id === selectedState)
            .map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
        </select>
      </Field>
    </VStack>
  )
}

export default LocationSelector
