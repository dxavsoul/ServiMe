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
  FiEdit, 
  FiTrash2, 
  FiMap,
  FiFilter
} from "react-icons/fi"
import { 
  type StateWithCountryPublic,
  StatesService,
  CountriesService
} from "../../client"

// Import components
import { AddState, EditState, DeleteState } from "../../components/States"
import { Field } from "../../components/ui/field"
import { Checkbox } from "../../components/ui/checkbox"

export const Route = createFileRoute("/_layout/states")({
  component: States,
})

function States() {
  // Fetch states from API
  const { 
    data: statesResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["states"],
    queryFn: () => StatesService.readStates({ limit: 1000 }),
  })

  // Fetch countries for the dropdown
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: () => CountriesService.readCountries({ limit: 1000, active_only: true }),
  })

  // Extract data arrays from API responses
  const states = statesResponse?.data || []
  const countries = countriesData?.data || []

  const [editingState, setEditingState] = useState<StateWithCountryPublic | null>(null)
  const [deletingState, setDeletingState] = useState<StateWithCountryPublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCountry, setFilterCountry] = useState("")
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  // Function to add new state (for immediate UI updates)
  const handleAddState = (_newState: any) => {
    refetch()
  }

  // Function to update state (for immediate UI updates)
  const handleUpdateState = (_updatedState: StateWithCountryPublic) => {
    refetch()
  }

  // Function to delete state (for immediate UI updates)
  const handleDeleteState = (_id: string) => {
    refetch()
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text>Loading states...</Text>
        </VStack>
      </Container>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text color="red.500">Error loading states. Please try again.</Text>
          <Button onClick={() => refetch()}>Retry</Button>
        </VStack>
      </Container>
    )
  }

  // Filter states based on search and filters
  const filteredStates = states.filter(state => {
    const matchesSearch = 
      state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (state.country && state.country.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCountry = !filterCountry || state.country?.code === filterCountry
    const matchesActiveFilter = !showActiveOnly || state.is_active
    
    return matchesSearch && matchesCountry && matchesActiveFilter
  })

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="lg">States & Provinces</Heading>
            <Text color="gray.500">Manage states, provinces, and regions</Text>
          </VStack>
          <AddState 
            onAdd={handleAddState}
            countries={countries}
            countriesLoading={countriesLoading}
          />
        </HStack>

        {/* Search and Filters */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4}>
              <HStack gap={4} width="full">
                <Input
                  placeholder="Search states..."
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
                    onChange={(e) => setFilterCountry(e.target.value)}
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

                <Field label="Status Filter">
                  <HStack>
                    <Checkbox
                      checked={showActiveOnly}
                      onCheckedChange={(details) => setShowActiveOnly(!!details.checked)}
                    />
                    <Text fontSize="sm">Active states only</Text>
                  </HStack>
                </Field>

                <HStack>
                  <FiFilter />
                  <Text fontSize="sm" color="gray.500">
                    {filteredStates.length} of {states.length} states
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {filteredStates.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiMap />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No states found</EmptyState.Title>
                <EmptyState.Description>
                  {searchTerm || filterCountry || showActiveOnly
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by creating your first state or province."}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>State/Province Name</Table.ColumnHeader>
                <Table.ColumnHeader>Code</Table.ColumnHeader>
                <Table.ColumnHeader>Country</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredStates.map((state) => (
                <Table.Row key={state.id}>
                  <Table.Cell>
                    <HStack>
                      <FiMap />
                      <Text fontWeight="medium">{state.name}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline" fontFamily="mono">
                      {state.code}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm">{state.country?.name}</Text>
                      <Badge variant="subtle" size="sm">
                        {state.country?.code}
                      </Badge>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      variant={state.is_active ? "solid" : "subtle"}
                      colorScheme={state.is_active ? "green" : "gray"}
                    >
                      {state.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingState(state)}
                      >
                        <FiEdit />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        onClick={() => setDeletingState(state)}
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

      {/* Edit Modal */}
      {editingState && (
        <EditState
          state={editingState}
          onUpdate={handleUpdateState}
          onClose={() => setEditingState(null)}
          countries={countries}
        />
      )}

      {/* Delete Modal */}
      {deletingState && (
        <DeleteState
          state={deletingState}
          onDelete={handleDeleteState}
          onClose={() => setDeletingState(null)}
        />
      )}
    </Container>
  )
}
