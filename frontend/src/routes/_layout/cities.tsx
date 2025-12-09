import { createFileRoute } from "@tanstack/react-router"
import {
  Container,
  EmptyState,
  Heading,
  Table,
  VStack,
  Text,
  HStack,
  Badge,
  Button,
  Input,
  Card,
} from "@chakra-ui/react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  FiSearch, 
  FiTrash2, 
  FiMapPin,
  FiFilter,
  FiUsers
} from "react-icons/fi"
import { 
  CitiesService,
  CountriesService,
  StatesService
} from "../../client"

// Import components
import { AddCity, EditCity } from "../../components/Cities"
import { Field } from "../../components/ui/field"
import { Checkbox } from "../../components/ui/checkbox"

export const Route = createFileRoute("/_layout/cities")({
  component: Cities,
})

// Utility function to format coordinates
const formatCoordinate = (coord: number, isLatitude: boolean) => {
  const direction = isLatitude 
    ? (coord >= 0 ? 'N' : 'S')
    : (coord >= 0 ? 'E' : 'W')
  return `${Math.abs(coord).toFixed(4)}°${direction}`
}

// Utility function to format population
const formatPopulation = (population: number | null | undefined) => {
  if (!population) return "N/A"
  return new Intl.NumberFormat().format(population)
}

function Cities() {
  // Fetch cities from API
  const { 
    data: citiesResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["cities"],
    queryFn: () => CitiesService.readCities({ limit: 1000 }),
  })

  // Fetch countries and states for the dropdowns
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: () => CountriesService.readCountries({ limit: 1000, active_only: true }),
  })

  const { data: statesData, isLoading: statesLoading } = useQuery({
    queryKey: ["states"],
    queryFn: () => StatesService.readStates({ limit: 1000 }),
  })

  // Extract data arrays from API responses
  const cities = citiesResponse?.data || []
  const countries = countriesData?.data || []
  const states = statesData?.data || []

  const [searchTerm, setSearchTerm] = useState("")
  const [filterCountry, setFilterCountry] = useState("")
  const [filterState, setFilterState] = useState("")
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [showPopularOnly, setShowPopularOnly] = useState(false)

  // Function to add new city (for immediate UI updates)
  const handleAddCity = (_newCity: any) => {
    refetch()
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text>Loading cities...</Text>
        </VStack>
      </Container>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text color="red.500">Error loading cities. Please try again.</Text>
          <Button onClick={() => refetch()}>Retry</Button>
        </VStack>
      </Container>
    )
  }

  // Filter states based on selected country
  const filteredStatesForDropdown = states.filter(state => 
    !filterCountry || state.country?.code === filterCountry
  )

  // Filter cities based on search and filters
  const filteredCities = cities.filter(city => {
    const matchesSearch = 
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (city.country && city.country.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (city.state && city.state.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCountry = !filterCountry || city.country?.code === filterCountry
    const matchesState = !filterState || city.state?.code === filterState
    const matchesActiveFilter = !showActiveOnly || city.is_active
    const matchesPopularFilter = !showPopularOnly || (city.population && city.population > 100000)
    
    return matchesSearch && matchesCountry && matchesState && matchesActiveFilter && matchesPopularFilter
  })

  const handleCountryFilterChange = (countryCode: string) => {
    setFilterCountry(countryCode)
    setFilterState("") // Reset state filter when country changes
  }

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="lg">Cities</Heading>
            <Text color="gray.500">Manage cities and their geographic information</Text>
          </VStack>
          <AddCity 
            onAdd={handleAddCity}
            countries={countries}
            states={states}
            countriesLoading={countriesLoading}
            statesLoading={statesLoading}
          />
        </HStack>

        {/* Search and Filters */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4}>
              <HStack gap={4} width="full">
                <Input
                  placeholder="Search cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxW="400px"
                />
                <Button variant="outline">
                  <FiSearch />
                </Button>
              </HStack>
              
              <HStack gap={4} width="full" wrap="wrap">
                <Field label="Country">
                  <select
                    value={filterCountry}
                    onChange={(e) => handleCountryFilterChange(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      minWidth: "200px"
                    }}
                  >
                    <option value="">All Countries</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="State/Province">
                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    disabled={!filterCountry}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      minWidth: "200px"
                    }}
                  >
                    <option value="">
                      {!filterCountry ? "Select country first" : "All States"}
                    </option>
                    {filteredStatesForDropdown.map((state) => (
                      <option key={state.id} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Filters">
                  <VStack align="start" gap={2}>
                    <HStack>
                      <Checkbox
                        checked={showActiveOnly}
                        onCheckedChange={(details) => setShowActiveOnly(!!details.checked)}
                      />
                      <Text fontSize="sm">Active cities only</Text>
                    </HStack>
                    <HStack>
                      <Checkbox
                        checked={showPopularOnly}
                        onCheckedChange={(details) => setShowPopularOnly(!!details.checked)}
                      />
                      <Text fontSize="sm">Popular cities (100K+ pop.)</Text>
                    </HStack>
                  </VStack>
                </Field>

                <HStack>
                  <FiFilter />
                  <Text fontSize="sm" color="gray.500">
                    {filteredCities.length} of {cities.length} cities
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {filteredCities.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiMapPin />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No cities found</EmptyState.Title>
                <EmptyState.Description>
                  {searchTerm || filterCountry || filterState || showActiveOnly || showPopularOnly
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by creating your first city."}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>City Name</Table.ColumnHeader>
                <Table.ColumnHeader>Location</Table.ColumnHeader>
                <Table.ColumnHeader>Coordinates</Table.ColumnHeader>
                <Table.ColumnHeader>Population</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredCities.map((city) => (
                <Table.Row key={city.id}>
                  <Table.Cell>
                    <HStack>
                      <FiMapPin />
                      <Text fontWeight="medium">{city.name}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm">{city.state?.name}, {city.country?.name}</Text>
                      <HStack gap={2}>
                        <Badge variant="subtle" size="sm">
                          {city.state?.code}
                        </Badge>
                        <Badge variant="subtle" size="sm">
                          {city.country?.code}
                        </Badge>
                      </HStack>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" fontFamily="mono">
                        {formatCoordinate(city.latitude, true)}
                      </Text>
                      <Text fontSize="sm" fontFamily="mono">
                        {formatCoordinate(city.longitude, false)}
                      </Text>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <FiUsers size={14} />
                      <Text fontSize="sm">{formatPopulation(city.population)}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      variant={city.is_active ? "solid" : "subtle"}
                      colorScheme={city.is_active ? "green" : "gray"}
                    >
                      {city.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <EditCity
                        city={city}
                        countries={countries}
                        states={states}
                        countriesLoading={countriesLoading}
                        statesLoading={statesLoading}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        onClick={() => {
                          // TODO: Implement delete functionality
                          alert("Delete functionality not yet implemented")
                        }}
                      >
                        <FiTrash2 />
                        Delete
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </VStack>
    </Container>
  )
}
