import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
  Text,
  Link,
  Input,
  IconButton,
  HStack,
  Button,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch, FiChevronUp, FiChevronDown, FiMinus } from "react-icons/fi"
import { z } from "zod"
import { useMemo } from "react"

import { BranchesService } from "@/client"
import { BranchActionsMenu } from "@/components/Branches/BranchActionsMenu"
import AddBranch from "@/components/Branches/AddBranch"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const branchesSearchSchema = z.object({
  page: z.number().catch(1),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  nameSearch: z.string().optional(),
  companySearch: z.string().optional(),
  contactSearch: z.string().optional(),
  locationSearch: z.string().optional(),
  statusSearch: z.string().optional(),
})

const PER_PAGE = 5

function getBranchesQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      BranchesService.readBranchesWithDetails({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["branches", { page }],
  }
}

export const Route = createFileRoute("/_layout/branches")({
  component: Branches,
  validateSearch: (search) => branchesSearchSchema.parse(search),
})

function BranchesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = Route.useSearch()
  const { 
    page = 1, 
    sortBy, 
    sortOrder, 
    nameSearch = "", 
    companySearch = "", 
    contactSearch = "", 
    locationSearch = "", 
    statusSearch = "" 
  } = searchParams

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getBranchesQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const updateSearch = (updates: Partial<typeof searchParams>) => {
    navigate({
      search: (prev: any) => ({ ...prev, ...updates, page: 1 }),
    })
  }

  const setPage = (page: number) =>
    navigate({
      search: (prev: any) => ({ ...prev, page }),
    })

  const toggleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc"
    updateSearch({ sortBy: column, sortOrder: newSortOrder })
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <FiMinus size={14} />
    return sortOrder === "asc" ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
  }

  // Filter and sort the data locally
  const filteredAndSortedBranches = useMemo(() => {
    let filtered = data?.data ?? []

    // Apply filters
    if (nameSearch) {
      filtered = filtered.filter(branch => 
        branch.name?.toLowerCase().includes(nameSearch.toLowerCase()) ||
        branch.code?.toLowerCase().includes(nameSearch.toLowerCase())
      )
    }
    if (companySearch) {
      filtered = filtered.filter(branch => 
        branch.company_name?.toLowerCase().includes(companySearch.toLowerCase()) ||
        branch.manager_name?.toLowerCase().includes(companySearch.toLowerCase())
      )
    }
    if (contactSearch) {
      filtered = filtered.filter(branch => 
        branch.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        branch.phone?.toLowerCase().includes(contactSearch.toLowerCase())
      )
    }
    if (locationSearch) {
      filtered = filtered.filter(branch => 
        branch.location_city?.name?.toLowerCase().includes(locationSearch.toLowerCase()) ||
        branch.address?.toLowerCase().includes(locationSearch.toLowerCase()) ||
        branch.postal_code?.toLowerCase().includes(locationSearch.toLowerCase())
      )
    }
    if (statusSearch) {
      const isActiveSearch = statusSearch.toLowerCase().includes("active")
      filtered = filtered.filter(branch => 
        isActiveSearch ? branch.is_active : !branch.is_active
      )
    }

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (sortBy) {
          case "name":
            aValue = a.name || ""
            bValue = b.name || ""
            break
          case "company":
            aValue = a.company_name || ""
            bValue = b.company_name || ""
            break
          case "contact":
            aValue = a.email || a.phone || ""
            bValue = b.email || b.phone || ""
            break
          case "location":
            aValue = a.location_city?.name || ""
            bValue = b.location_city?.name || ""
            break
          case "status":
            aValue = a.is_active ? "Active" : "Inactive"
            bValue = b.is_active ? "Active" : "Inactive"
            break
          default:
            return 0
        }
        
        const comparison = String(aValue).localeCompare(String(bValue))
        return sortOrder === "desc" ? -comparison : comparison
      })
    }

    return filtered
  }, [data?.data, nameSearch, companySearch, contactSearch, locationSearch, statusSearch, sortBy, sortOrder])

  const branches = filteredAndSortedBranches.slice(0, PER_PAGE)
  const count = filteredAndSortedBranches.length

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

  if (branches.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any branches yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new branch to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      {/* Clear All Filters Button */}
      {(nameSearch || companySearch || contactSearch || locationSearch || statusSearch) && (
        <Flex justify="flex-end" mb={4}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateSearch({
              nameSearch: "",
              companySearch: "",
              contactSearch: "",
              locationSearch: "",
              statusSearch: "",
            })}
          >
            Clear All Filters
          </Button>
        </Flex>
      )}
      
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="md">
              <VStack gap={2} align="stretch">
                <HStack gap={2}>
                  <Text fontWeight="semibold">Branch Name</Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={() => toggleSort("name")}
                    aria-label="Sort by name"
                  >
                    {getSortIcon("name")}
                  </IconButton>
                </HStack>
                <Input
                  placeholder="Search branches..."
                  size="sm"
                  value={nameSearch}
                  onChange={(e) => updateSearch({ nameSearch: e.target.value })}
                />
              </VStack>
            </Table.ColumnHeader>
            <Table.ColumnHeader w="md">
              <VStack gap={2} align="stretch">
                <HStack gap={2}>
                  <Text fontWeight="semibold">Company</Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={() => toggleSort("company")}
                    aria-label="Sort by company"
                  >
                    {getSortIcon("company")}
                  </IconButton>
                </HStack>
                <Input
                  placeholder="Search company..."
                  size="sm"
                  value={companySearch}
                  onChange={(e) => updateSearch({ companySearch: e.target.value })}
                />
              </VStack>
            </Table.ColumnHeader>
            <Table.ColumnHeader w="md">
              <VStack gap={2} align="stretch">
                <HStack gap={2}>
                  <Text fontWeight="semibold">Contact</Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={() => toggleSort("contact")}
                    aria-label="Sort by contact"
                  >
                    {getSortIcon("contact")}
                  </IconButton>
                </HStack>
                <Input
                  placeholder="Search contact..."
                  size="sm"
                  value={contactSearch}
                  onChange={(e) => updateSearch({ contactSearch: e.target.value })}
                />
              </VStack>
            </Table.ColumnHeader>
            <Table.ColumnHeader w="md">
              <VStack gap={2} align="stretch">
                <HStack gap={2}>
                  <Text fontWeight="semibold">Location</Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={() => toggleSort("location")}
                    aria-label="Sort by location"
                  >
                    {getSortIcon("location")}
                  </IconButton>
                </HStack>
                <Input
                  placeholder="Search location..."
                  size="sm"
                  value={locationSearch}
                  onChange={(e) => updateSearch({ locationSearch: e.target.value })}
                />
              </VStack>
            </Table.ColumnHeader>
            <Table.ColumnHeader w="md">
              <VStack gap={2} align="stretch">
                <HStack gap={2}>
                  <Text fontWeight="semibold">Status</Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={() => toggleSort("status")}
                    aria-label="Sort by status"
                  >
                    {getSortIcon("status")}
                  </IconButton>
                </HStack>
                <Input
                  placeholder="Active/Inactive..."
                  size="sm"
                  value={statusSearch}
                  onChange={(e) => updateSearch({ statusSearch: e.target.value })}
                />
              </VStack>
            </Table.ColumnHeader>
            <Table.ColumnHeader w="sm">
              <Text fontWeight="semibold">Actions</Text>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {branches?.map((branch) => (
            <Table.Row key={branch.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell>
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium" truncate maxW="sm">
                    {branch.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500" truncate maxW="sm">
                    Code: {branch.code || "N/A"}
                  </Text>
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium" truncate maxW="sm">
                    {branch.company_name || "N/A"}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Manager: {branch.manager_name || "N/A"}
                  </Text>
                </VStack>
              </Table.Cell>
              
              <Table.Cell>
                <VStack align="start" gap={1}>
                  {branch.email && (
                    <Link 
                      href={`mailto:${branch.email}`}
                      color="blue.500"
                      fontSize="sm"
                    >
                      {branch.email}
                    </Link>
                  )}
                  {branch.phone && (
                    <Text fontSize="sm" color="gray.600">
                      {branch.phone}
                    </Text>
                  )}
                  {!branch.email && !branch.phone && (
                    <Text color="gray.500" fontSize="sm">N/A</Text>
                  )}
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <VStack align="start" gap={1}>
                  {branch.location_city && (
                    <Text fontSize="sm">
                      {branch.location_city.name}
                    </Text>
                  )}
                  {branch.postal_code && (
                    <Text fontSize="sm" color="gray.600">
                      {branch.postal_code}
                    </Text>
                  )}
                  {branch.address && (
                    <Text fontSize="sm" color="gray.600" truncate maxW="sm">
                      {branch.address}
                    </Text>
                  )}
                  {!branch.location_city && !branch.address && (
                    <Text color="gray.500" fontSize="sm">N/A</Text>
                  )}
                </VStack>
              </Table.Cell>
               <Table.Cell truncate maxW="sm">
                <VStack align="start" gap={1}>
                  <Text 
                    fontSize="sm" 
                    fontWeight="medium"
                    color={branch.is_active ? "green.600" : "gray.500"}
                    px={2}
                    py={1}
                    bg={branch.is_active ? "green.50" : "gray.50"}
                    borderRadius="md"
                    display="inline-block"
                  >
                    {branch.is_active ? "Active" : "Inactive"}
                  </Text>
                  {/* Demo: Ratings preview - this would be dynamic data */}
                  <HStack gap={1} mt={1}>
                    <Text fontSize="xs" color="gray.500">Rating:</Text>
                    <HStack gap={0.5}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text key={star} color={star <= 4 ? "yellow.400" : "gray.300"} fontSize="xs">
                          ★
                        </Text>
                      ))}
                    </HStack>
                    <Text fontSize="xs" color="gray.500">4.2 (23)</Text>
                  </HStack>
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <BranchActionsMenu branch={branch} />
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

function Branches() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Branches Management
      </Heading>
      <Text color="gray.600" mb={4}>
        Manage your branch locations with full CRUD operations
      </Text>
      <AddBranch />
      <BranchesTable />
    </Container>
  )
}
