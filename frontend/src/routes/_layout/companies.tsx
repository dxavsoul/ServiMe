import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
  Text,
  Link,
  Image,
  Box,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { type CompanyPublic, CompaniesService } from "@/client"
import { CompanyActionsMenu } from "@/components/Companies/CompanyActionsMenu"
import AddCompany from "@/components/Companies/AddCompany"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const companiesSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getCompaniesQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      CompaniesService.readCompanies({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["companies", { page }],
  }
}

export const Route = createFileRoute("/_layout/companies")({
  component: Companies,
  validateSearch: (search) => companiesSearchSchema.parse(search),
})

function CompaniesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getCompaniesQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const companies = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        {Array.from({ length: 3 }).map((_, i) => (
          <Table.Root key={i} size={{ base: "sm", md: "md" }}>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Loading...</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        ))}
      </VStack>
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
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">Logo</Table.ColumnHeader>
            <Table.ColumnHeader w="md">Company Name</Table.ColumnHeader>
            <Table.ColumnHeader w="md">Industry</Table.ColumnHeader>
            <Table.ColumnHeader w="md">Website</Table.ColumnHeader>
            <Table.ColumnHeader w="md">Contact</Table.ColumnHeader>
            <Table.ColumnHeader w="md">Location</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {companies?.map((company: CompanyPublic) => (
            <Table.Row key={company.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell>
                <Box w="12" h="12" display="flex" alignItems="center" justifyContent="center">
                  {company.logo_image_url ? (
                    <Image
                      src={company.logo_image_url}
                      alt={`${company.name} logo`}
                      boxSize="10"
                      objectFit="contain"
                      borderRadius="md"
                    />
                  ) : (
                    <Box
                      w="10"
                      h="10"
                      bg="gray.100"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="gray.500"
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {company.name.charAt(0).toUpperCase()}
                    </Box>
                  )}
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
                {company.industry_type_id || "N/A"}
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
                  {company.address && (
                    <Text fontSize="sm" color="gray.600" truncate maxW="sm">
                      {company.address}
                    </Text>
                  )}
                  {!company.address && (
                    <Text color="gray.500" fontSize="sm">N/A</Text>
                  )}
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <CompanyActionsMenu company={company} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Companies() {
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
