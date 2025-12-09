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
  FiGlobe,
  FiFilter
} from "react-icons/fi"
import { 
  type CountryPublic,
  CountriesService
} from "../../client"

// Import components
import { AddCountry, EditCountry, DeleteCountry } from "../../components/Countries"
import { Field } from "../../components/ui/field"
import { Checkbox } from "../../components/ui/checkbox"

export const Route = createFileRoute("/_layout/countries")({
  component: Countries,
})

function Countries() {
  // Fetch countries from API
  const { 
    data: countriesResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["countries"],
    queryFn: () => CountriesService.readCountries({ limit: 1000 }),
  })

  // Extract countries array from API response
  const countries = countriesResponse?.data || []

  const [editingCountry, setEditingCountry] = useState<CountryPublic | null>(null)
  const [deletingCountry, setDeletingCountry] = useState<CountryPublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  // Function to add new country (for immediate UI updates)
  const handleAddCountry = (_newCountry: CountryPublic) => {
    refetch()
  }

  // Function to update country (for immediate UI updates)
  const handleUpdateCountry = (_updatedCountry: CountryPublic) => {
    refetch()
  }

  // Function to delete country (for immediate UI updates)
  const handleDeleteCountry = (_id: string) => {
    refetch()
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text>Loading countries...</Text>
        </VStack>
      </Container>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text color="red.500">Error loading countries. Please try again.</Text>
          <Button onClick={() => refetch()}>Retry</Button>
        </VStack>
      </Container>
    )
  }

  // Filter countries based on search and filters
  const filteredCountries = countries.filter(country => {
    const matchesSearch = 
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesActiveFilter = !showActiveOnly || country.is_active
    
    return matchesSearch && matchesActiveFilter
  })

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="lg">Countries</Heading>
            <Text color="gray.500">Manage countries and their ISO codes</Text>
          </VStack>
          <AddCountry onAdd={handleAddCountry} />
        </HStack>

        {/* Search and Filters */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4}>
              <HStack gap={4} width="full">
                <Input
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxW="400px"
                />
                <Button variant="outline">
                  <FiSearch />
                </Button>
              </HStack>
              
              <HStack gap={4} width="full" wrap="wrap">
                <Field label="Status Filter">
                  <HStack>
                    <Checkbox
                      checked={showActiveOnly}
                      onCheckedChange={(details) => setShowActiveOnly(!!details.checked)}
                    />
                    <Text fontSize="sm">Active countries only</Text>
                  </HStack>
                </Field>

                <HStack>
                  <FiFilter />
                  <Text fontSize="sm" color="gray.500">
                    {filteredCountries.length} of {countries.length} countries
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {filteredCountries.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiGlobe />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No countries found</EmptyState.Title>
                <EmptyState.Description>
                  {searchTerm || showActiveOnly
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by creating your first country."}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Country Name</Table.ColumnHeader>
                <Table.ColumnHeader>ISO Code</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredCountries.map((country) => (
                <Table.Row key={country.id}>
                  <Table.Cell>
                    <HStack>
                      <FiGlobe />
                      <Text fontWeight="medium">{country.name}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline" fontFamily="mono">
                      {country.code}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      variant={country.is_active ? "solid" : "subtle"}
                      colorScheme={country.is_active ? "green" : "gray"}
                    >
                      {country.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCountry(country)}
                      >
                        <FiEdit />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        onClick={() => setDeletingCountry(country)}
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
      {editingCountry && (
        <EditCountry
          country={editingCountry}
          onUpdate={handleUpdateCountry}
          onClose={() => setEditingCountry(null)}
        />
      )}

      {/* Delete Modal */}
      {deletingCountry && (
        <DeleteCountry
          country={deletingCountry}
          onDelete={handleDeleteCountry}
          onClose={() => setDeletingCountry(null)}
        />
      )}
    </Container>
  )
}
