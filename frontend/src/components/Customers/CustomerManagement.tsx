import { useState } from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
  HStack,
  Badge,
  IconButton,
  Input,
} from "@chakra-ui/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin } from "react-icons/fi"

import type { UserPublic, CustomerPublic, CustomersPublic, CustomerStats } from "@/client"
import { CustomersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import AddCustomer from "./AddCustomer"
import EditCustomer from "./EditCustomer"
import { InputGroup } from "../ui/input-group"

const PER_PAGE = 10

// Customer Stats Component
function CustomerStatsCards() {
  const { data: stats, isLoading, error } = useQuery<CustomerStats>({
    queryKey: ["customer-stats"],
    queryFn: () => CustomersService.getCustomerStats(),
  })

  if (isLoading) return <Text>Loading stats...</Text>
  if (error) return <Text color="red.500">Error loading stats</Text>

  return (
    <HStack gap={4} wrap="wrap">
      <Box p={4} bg="blue.50" borderRadius="md" minW="150px">
        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
          {stats?.total_customers || 0}
        </Text>
        <Text fontSize="sm" color="blue.600">
          Total Customers
        </Text>
      </Box>
      <Box p={4} bg="green.50" borderRadius="md" minW="150px">
        <Text fontSize="2xl" fontWeight="bold" color="green.600">
          {stats?.active_customers || 0}
        </Text>
        <Text fontSize="sm" color="green.600">
          Active Customers
        </Text>
      </Box>
      <Box p={4} bg="red.50" borderRadius="md" minW="150px">
        <Text fontSize="2xl" fontWeight="bold" color="red.600">
          {stats?.inactive_customers || 0}
        </Text>
        <Text fontSize="sm" color="red.600">
          Inactive Customers
        </Text>
      </Box>
      <Box p={4} bg="purple.50" borderRadius="md" minW="150px">
        <Text fontSize="2xl" fontWeight="bold" color="purple.600">
          {stats?.customers_with_location || 0}
        </Text>
        <Text fontSize="sm" color="purple.600">
          With Location
        </Text>
      </Box>
    </HStack>
  )
}

// Customers Table Component
function CustomersTable() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<CustomerPublic | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Main customers query with search
  const { data, isLoading, error } = useQuery<CustomersPublic>({
    queryKey: ["customers", page, searchQuery],
    queryFn: () => {
      if (searchQuery.trim()) {
        return CustomersService.searchCustomers({
          q: searchQuery,
          skip: (page - 1) * PER_PAGE,
          limit: PER_PAGE,
        })
      }
      return CustomersService.readCustomers({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      })
    },
  })

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (customerId: string) =>
      CustomersService.deleteCustomer({ customer_id: customerId }),
    onSuccess: () => {
      showSuccessToast("Customer deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] })
    },
    onError: (error: any) => {
      showErrorToast(
        `Failed to delete customer: ${error.message || "Unknown error"}`
      )
    },
  })

  const handleDeleteCustomer = (customer: CustomerPublic) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.full_name}"?`)) {
      deleteMutation.mutate(customer.id)
    }
  }

  const handleEditCustomer = (customer: CustomerPublic) => {
    setEditingCustomer(customer)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingCustomer(null)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page when searching
  }

  if (isLoading) return <Text>Loading customers...</Text>

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md">
        <Text color="red.700">
          Error loading customers: {error.message || "Unable to fetch customer data"}
        </Text>
        <Text fontSize="sm" color="red.600" mt={1}>
          Please check your connection and try again.
        </Text>
      </Box>
    )
  }

  const customers = data?.data ?? []
  const total = data?.count ?? 0

  return (
    <VStack gap={4} alignItems="stretch">
      {/* Search Bar */}
      <form onSubmit={handleSearch}>
        <InputGroup maxW="400px" startElement={<FiSearch />}>
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </form>

      {/* Results info */}
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="sm" color="gray.600">
          {searchQuery ? `Search results for "${searchQuery}"` : "All customers"}
        </Text>
        <Text fontSize="sm" color="gray.600">
          Showing {customers.length} of {total} customers
        </Text>
      </Flex>

      {/* Table */}
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Customer</Table.ColumnHeader>
            <Table.ColumnHeader>Contact</Table.ColumnHeader>
            <Table.ColumnHeader>Location</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {customers.map((customer) => (
            <Table.Row key={customer.id}>
              <Table.Cell>
                <VStack alignItems="start" gap={1}>
                  <Text fontWeight="medium">{customer.full_name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {customer.email}
                  </Text>
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <VStack alignItems="start" gap={1}>
                  {customer.phone && (
                    <Text fontSize="sm">{customer.phone}</Text>
                  )}
                  {customer.address && (
                    <Text fontSize="sm" color="gray.500">
                      {customer.address}
                    </Text>
                  )}
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <VStack alignItems="start" gap={1}>
                  {customer.city && (
                    <Text fontSize="sm">
                      {customer.city}
                      {customer.state && `, ${customer.state}`}
                    </Text>
                  )}
                  {customer.country && (
                    <Text fontSize="sm" color="gray.500">
                      {customer.country}
                      {customer.postal_code && ` ${customer.postal_code}`}
                    </Text>
                  )}
                  {customer.latitude && customer.longitude && (
                    <HStack gap={1}>
                      <FiMapPin size={12} />
                      <Text fontSize="xs" color="gray.400">
                        {customer.latitude.toFixed(4)}, {customer.longitude.toFixed(4)}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={customer.is_active ? "green" : "red"}>
                  {customer.is_active ? "Active" : "Inactive"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="blue"
                    aria-label="Edit customer"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <FiEdit2 />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    aria-label="Delete customer"
                    onClick={() => handleDeleteCustomer(customer)}
                    loading={deleteMutation.isPending}
                  >
                    <FiTrash2 />
                  </IconButton>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Pagination */}
      <Flex justifyContent="space-between" mt={4} alignItems="center">
        <Text fontSize="sm" color="gray.600">
          Page {page} of {Math.ceil(total / PER_PAGE)}
        </Text>
        <HStack>
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            disabled={page * PER_PAGE >= total}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </HStack>
      </Flex>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomer
          customer={editingCustomer}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
        />
      )}
    </VStack>
  )
}

// Admin Access Check Component
function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  if (!currentUser?.is_superuser) {
    return (
      <Box p={8} textAlign="center" bg="red.50" borderRadius="md">
        <Heading size="md" color="red.700" mb={4}>
          Access Denied
        </Heading>
        <Text color="red.600">
          Customer management is restricted to administrators only.
        </Text>
        <Text fontSize="sm" color="red.500" mt={2}>
          Contact your system administrator if you need access to this feature.
        </Text>
      </Box>
    )
  }

  return <>{children}</>
}

// Main Customer Management Component
function CustomerManagement() {
  return (
    <AdminAccessGuard>
      <Container maxW="full">
        <VStack gap={6} alignItems="stretch">
          {/* Header */}
          <Flex justifyContent="space-between" alignItems="center">
            <Heading size="lg" gap={2}>
              <FiUsers />
              Customer Management
            </Heading>
            <AddCustomer>
              <Button colorScheme="blue">
                <FiPlus />
                Add New Customer
              </Button>
            </AddCustomer>
          </Flex>

          {/* Admin Banner */}
          <Flex p={3} bg="blue.50" borderRadius="md" alignItems="center">
            <Badge colorScheme="blue" mr={2}>Admin Only</Badge>
            <Text color="blue.700">
              You have administrative access to manage all customer accounts
            </Text>
          </Flex>

          {/* Customer Stats */}
          <Box>
            <Heading size="md" mb={4}>Customer Statistics</Heading>
            <CustomerStatsCards />
          </Box>

          {/* Customers Table */}
          <Box>
            <Heading size="md" mb={4}>All Customers</Heading>
            <CustomersTable />
          </Box>
        </VStack>
      </Container>
    </AdminAccessGuard>
  )
}

export default CustomerManagement
