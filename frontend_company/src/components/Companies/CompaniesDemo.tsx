import {
  Container,
  EmptyState,
  Heading,
  Table,
  VStack,
  Text,
  Link,
  Image,
  Badge,
  Box,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiSearch } from "react-icons/fi"

import { CompaniesService } from "../../client"
import { CompanyActionsMenu } from "./CompanyActionsMenu"
import AddCompany from "./AddCompany"

function CompaniesTable() {
  // Fetch companies with location data
  const { data: companiesData, isLoading, error } = useQuery({
    queryKey: ["companies", "with-location"],
    queryFn: () => CompaniesService.readCompaniesWithLocation({ limit: 100 }),
  })

  const companies = companiesData?.data || []

  if (isLoading) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <VStack textAlign="center">
            <EmptyState.Title>Loading companies...</EmptyState.Title>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  if (error) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <VStack textAlign="center">
            <EmptyState.Title>Error loading companies</EmptyState.Title>
            <EmptyState.Description>
              {error.message || "Something went wrong"}
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  if (companies.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any companies yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new company to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <Table.Root size={{ base: "sm", md: "md" }}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader w="xs">Logo</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Company Name</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Industry</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Website</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Contact</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Location</Table.ColumnHeader>
          <Table.ColumnHeader w="xs">Status</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {companies?.map((company) => (
          <Table.Row key={company.id}>
            <Table.Cell>
              {company.logo_image_url ? (
                <Image
                  src={company.logo_image_url}
                  alt={`${company.name} logo`}
                  boxSize="40px"
                  objectFit="cover"
                  borderRadius="md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    if (target.nextSibling) {
                      (target.nextSibling as HTMLElement).style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <Box
                w="40px"
                h="40px"
                bg="gray.100"
                borderRadius="md"
                display={company.logo_image_url ? "none" : "flex"}
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                color="gray.500"
              >
                {company.name.charAt(0).toUpperCase()}
              </Box>
            </Table.Cell>
            <Table.Cell>
              <VStack align="start" gap={1}>
                <Text fontWeight="medium" truncate maxW="sm">
                  {company.name}
                </Text>
                <Text fontSize="sm" color="gray.500" truncate maxW="sm">
                  {company.description || "N/A"}
                </Text>
              </VStack>
            </Table.Cell>
            <Table.Cell truncate maxW="sm">
              {company.industry || "N/A"}
            </Table.Cell>
            <Table.Cell truncate maxW="sm">
              {company.website ? (
                <Link 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  color="blue.500"
                  textDecoration="underline"
                >
                  {company.website}
                </Link>
              ) : (
                <Text color="gray.500">N/A</Text>
              )}
            </Table.Cell>
            <Table.Cell>
              <VStack align="start" gap={1}>
                {company.email && (
                  <Link 
                    href={`mailto:${company.email}`}
                    color="blue.500"
                    fontSize="sm"
                  >
                    {company.email}
                  </Link>
                )}
                {company.phone && (
                  <Text fontSize="sm" color="gray.600">
                    {company.phone}
                  </Text>
                )}
                {!company.email && !company.phone && (
                  <Text color="gray.500" fontSize="sm">N/A</Text>
                )}
              </VStack>
            </Table.Cell>
            <Table.Cell>
              <VStack align="start" gap={1}>
                {company.city_name && company.country_name && (
                  <Text fontSize="sm">
                    {company.city_name}, {company.state_name}, {company.country_name}
                  </Text>
                )}
                {company.address && (
                  <Text fontSize="sm" color="gray.600" truncate maxW="sm">
                    {company.address}
                  </Text>
                )}
                {!company.city_name && !company.country_name && !company.address && (
                  <Text color="gray.500" fontSize="sm">N/A</Text>
                )}
              </VStack>
            </Table.Cell>
            <Table.Cell>
              <Badge 
                colorScheme={company.is_active ? "green" : "red"}
                variant="subtle"
              >
                {company.is_active ? "Active" : "Inactive"}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <CompanyActionsMenu company={company} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

const CompaniesDemo = () => {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Companies Management
      </Heading>
      <Text color="gray.600" mb={4}>
        Manage your company directory with full CRUD operations
      </Text>
      <AddCompany />
      <CompaniesTable />
    </Container>
  )
}

export default CompaniesDemo
