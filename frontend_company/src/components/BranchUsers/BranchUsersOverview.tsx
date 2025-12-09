import {
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Text,
  Badge,
  Input,
  VStack,
  Box,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"

import { BranchesService } from "../../client"
import type { BranchWithLocationPublic } from "../../client/branches"
import BranchUsers from "./BranchUsers"
import QuickAssignUser from "./QuickAssignUser"

const PER_PAGE = 10

const BranchUsersOverview = () => {
  const navigate = useNavigate()
  const search = useSearch({ from: "/_layout/branch-users" })
  const selectedBranchId = (search as any)?.branchId
  
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["branches", page, searchTerm],
    queryFn: () =>
      BranchesService.readBranchesWithDetails({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  })

  const filteredBranches = branches?.data?.filter((branch: BranchWithLocationPublic & { company_name: string }) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const selectedBranch = selectedBranchId 
    ? filteredBranches.find(b => b.id === selectedBranchId) || branches?.data?.find(b => b.id === selectedBranchId)
    : null

  const handleBranchSelect = (branchId: string) => {
    navigate({
      to: "/branch-users",
      search: { branchId }
    })
  }

  const handleBackToOverview = () => {
    navigate({
      to: "/branch-users",
      search: {}
    })
  }

  if (selectedBranchId && selectedBranch) {
    return (
      <Container maxW="full">
        <Flex align="center" gap={4} mb={6}>
          <Button variant="outline" onClick={handleBackToOverview}>
            ← Back to Overview
          </Button>
          <Box>
            <Heading size="lg">Branch Users</Heading>
            <Text color="gray.600">Managing users for: {selectedBranch.name}</Text>
          </Box>
        </Flex>
        <BranchUsers branchId={selectedBranchId} />
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container maxW="full">
        <Text>Loading...</Text>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container maxW="full">
        <Text color="red.500">Something went wrong</Text>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Branch Users Management
      </Heading>
      
      <Text fontSize="md" color="gray.600" mb={6}>
        Manage user assignments across all branches
      </Text>

      <VStack gap={6} align="stretch">
        <Flex gap={4} flexDirection={{ base: "column", md: "row" }} align={{ md: "center" }}>
          <Input
            placeholder="Search branches or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW={{ md: "300px" }}
          />
          <QuickAssignUser />
        </Flex>

        {filteredBranches.length > 0 ? (
          <>
            <Table.Root size={{ base: "sm", md: "md" }}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Branch Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Company</Table.ColumnHeader>
                  <Table.ColumnHeader>Location</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredBranches.map((branch: BranchWithLocationPublic & { company_name: string }) => (
                  <Table.Row key={branch.id}>
                    <Table.Cell>
                      <Text fontWeight="medium">{branch.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      {branch.company_name ? (
                        <Badge colorPalette="blue">
                          {branch.company_name}
                        </Badge>
                      ) : (
                        <Text color="gray.500">No company</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {branch.location_city 
                        ? branch.location_city.name
                        : branch.address || "N/A"}
                    </Table.Cell>
                    <Table.Cell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBranchSelect(branch.id)}
                      >
                        Manage Users
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            
            <Flex mt={4} justify="space-between" align="center">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Text>Page {page}</Text>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!branches?.data || branches.data.length < PER_PAGE}
              >
                Next
              </Button>
            </Flex>
          </>
        ) : (
          <Text textAlign="center" color="gray.500">
            {searchTerm ? "No branches found matching your search." : "No branches available."}
          </Text>
        )}
      </VStack>
    </Container>
  )
}

export default BranchUsersOverview
