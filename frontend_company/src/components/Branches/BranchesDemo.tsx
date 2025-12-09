import {
  Container,
  EmptyState,
  Heading,
  Table,
  VStack,
  Text,
  Link,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiSearch } from "react-icons/fi"

import { type BranchPublic } from "@/client"
import { BranchActionsMenu } from "./BranchActionsMenu"
import AddBranch from "./AddBranch"

// Demo-specific type that extends BranchPublic with extra properties for demonstration
interface DemoBranch extends BranchPublic {
  company_name?: string
  city?: string
  state?: string
  country?: string
}

// Mock data for demonstration
const mockBranches: DemoBranch[] = [
  {
    id: "1",
    name: "Headquarters",
    company_id: "company-1",
    code: "HQ001",
    address: "3118 42nd St",
    city: "Long Island City",
    state: "NY",
    country: "United States",
    postal_code: "11101",
    phone: "9176841338",
    email: "mxsarmiento@brainsolutions.nyc",
    manager_name: "Milton Sarmiento",
    is_active: true,
    created_by: "user-1",
    company_name: "Brain Solutions",
  },
  {
    id: "2",
    name: "West Coast Office",
    company_id: "company-2",
    code: "WC001",
    address: "456 Innovation Drive",
    city: "Palo Alto",
    state: "CA",
    country: "United States",
    postal_code: "94301",
    phone: "6501234567",
    email: "westcoast@techcorp.com",
    manager_name: "Sarah Johnson",
    is_active: true,
    created_by: "user-2",
    company_name: "Tech Corp",
  },
  {
    id: "3",
    name: "East Coast Office",
    company_id: "company-3",
    code: "EC001",
    address: "789 Wall Street",
    city: "New York",
    state: "NY",
    country: "United States",
    postal_code: "10005",
    phone: "2125551234",
    email: "eastcoast@fintech.com",
    manager_name: "David Wilson",
    is_active: true,
    created_by: "user-3",
    company_name: "FinTech Innovations",
  }
]

function BranchesTable() {
  const [branches] = useState<DemoBranch[]>(mockBranches)

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
    <Table.Root size={{ base: "sm", md: "md" }}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader w="md">Branch Name</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Company</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Manager</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Contact</Table.ColumnHeader>
          <Table.ColumnHeader w="md">Location</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {branches?.map((branch) => (
          <Table.Row key={branch.id}>
            <Table.Cell>
              <VStack align="start" gap={1}>
                <Text fontWeight="medium" truncate maxW="sm">
                  {branch.name}
                </Text>
                {branch.code && (
                  <Text fontSize="sm" color="gray.500" truncate maxW="sm">
                    Code: {branch.code}
                  </Text>
                )}
              </VStack>
            </Table.Cell>
            <Table.Cell>
              <Text fontWeight="medium" truncate maxW="sm">
                { branch.company_name }
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Text fontSize="sm" truncate maxW="sm">
                {branch.manager_name || "N/A"}
              </Text>
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
                {branch.city && branch.country && (
                  <Text fontSize="sm">
                    {branch.city}{branch.state && `, ${branch.state}`}, {branch.country}
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
                {!branch.city && !branch.country && !branch.address && (
                  <Text color="gray.500" fontSize="sm">N/A</Text>
                )}
              </VStack>
            </Table.Cell>
            <Table.Cell>
              <Text 
                fontSize="sm" 
                color={branch.is_active ? "green.600" : "red.600"}
                fontWeight="medium"
              >
                {branch.is_active ? "Active" : "Inactive"}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <BranchActionsMenu branch={branch} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

const BranchesDemo = () => {
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

export default BranchesDemo
