// Enhanced Admin Component Example
// This shows how to integrate the new enhanced user endpoints with your existing admin interface

import { useState } from "react"
import { Badge, Container, Flex, Heading, Table, Button, Text, VStack, HStack, Box } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"

import type { UserPublic } from "../../client"
import { 
  useAllUsers, 
  useUserApprovalStatus, 
  useCurrentUserProfile,
  useIsSuperAdmin 
} from "../../hooks/useEnhancedUsers"

const PER_PAGE = 5

// Enhanced Users Table with approval status
function EnhancedUsersTable() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  
  // Use the real enhanced users service
  const { isSuperAdmin } = useIsSuperAdmin()
  const { data: enhancedUsersData, isLoading: isLoadingEnhanced, error: enhancedError } = useAllUsers({
    skip: (page - 1) * PER_PAGE,
    limit: PER_PAGE
  })

  // Determine which data to use
  const isLoading = isLoadingEnhanced
  const users = enhancedUsersData?.data ?? []
  const count = enhancedUsersData?.total ?? 0

  if (isLoading) {
    return <Text>Loading users...</Text>
  }

  // Show enhanced error message if available
  if (enhancedError) {
    return (
      <Box>
        <Text color="red.500">Enhanced user API error: {enhancedError.message}</Text>
        <Text fontSize="sm" color="red.400" mt={1}>
          Please check your connection and try again.
        </Text>
      </Box>
    )
  }

  return (
    <>
      {/* Show enhanced features notification */}
      {enhancedUsersData && (
        <Flex mb={4} p={3} bg="green.50" borderRadius="md">
          <Text color="green.700">
            ✅ Using Enhanced User Management API with approval status and extended profiles
          </Text>
        </Flex>
      )}

      {/* Show SuperAdmin status */}
      {isSuperAdmin && (
        <Flex mb={4} p={3} bg="purple.50" borderRadius="md">
          <Badge colorScheme="purple" mr={2}>SuperAdmin</Badge>
          <Text color="purple.700">
            You have full access to all user management features
          </Text>
        </Flex>
      )}

      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">Full name</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Email</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Role</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
            {enhancedUsersData && (
              <>
                <Table.ColumnHeader w="sm">Department</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Position</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Last Login</Table.ColumnHeader>
              </>
            )}
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users?.map((user: any) => (
            <Table.Row key={user.id}>
              <Table.Cell color={!user.full_name ? "gray" : "inherit"}>
                {user.full_name || "N/A"}
                {currentUser?.id === user.id && (
                  <Badge ml="1" colorScheme="teal">
                    You
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>
                {user.email}
              </Table.Cell>
              <Table.Cell>
                {user.is_superuser ? "Superuser" : "User"}
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={user.is_active ? "green" : "red"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </Table.Cell>
              
              {/* Enhanced columns only shown when using enhanced API */}
              {enhancedUsersData && (
                <>
                  <Table.Cell>
                    {user.profile?.department || "N/A"}
                  </Table.Cell>
                  <Table.Cell>
                    {user.profile?.position || "N/A"}
                  </Table.Cell>
                  <Table.Cell>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"
                    }
                  </Table.Cell>
                </>
              )}
              
              <Table.Cell>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      
      {/* Simple pagination info */}
      <Flex justifyContent="space-between" mt={4} alignItems="center">
        <Text fontSize="sm" color="gray.600">
          Showing {users.length} of {count} users
        </Text>
        <HStack>
          <Button 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Text fontSize="sm">Page {page}</Text>
          <Button 
            size="sm" 
            disabled={page * PER_PAGE >= count}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </HStack>
      </Flex>
    </>
  )
}

// Approval Status Banner for current user
function UserApprovalBanner() {
  const { data: approvalStatus, isLoading, error } = useUserApprovalStatus()
  const { data: currentUser } = useCurrentUserProfile()

  if (isLoading) {
    return (
      <Flex mb={4} p={4} bg="gray.50" borderRadius="md" alignItems="center">
        <Text color="gray.600">Loading approval status...</Text>
      </Flex>
    )
  }
  
  if (error || !approvalStatus) {
    return (
      <Flex mb={4} p={4} bg="orange.50" borderRadius="md" alignItems="center">
        <Badge colorScheme="orange" mr={3}>Status Unavailable</Badge>
        <Text color="orange.700">
          {error?.message || "Unable to load approval status"}
        </Text>
      </Flex>
    )
  }

  if (approvalStatus.is_superuser) {
    return (
      <Flex mb={4} p={4} bg="purple.50" borderRadius="md" alignItems="center">
        <Badge colorScheme="purple" mr={3}>SuperAdmin</Badge>
        <Text color="purple.700">
          Full access to all resources - {approvalStatus.message}
        </Text>
      </Flex>
    )
  }

  if (!approvalStatus.approved) {
    return (
      <Flex mb={4} p={4} bg="orange.50" borderRadius="md" alignItems="center">
        <Badge colorScheme="orange" mr={3}>Pending Approval</Badge>
        <Text color="orange.700">
          {approvalStatus.message}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex mb={4} p={4} bg="green.50" borderRadius="md" alignItems="center">
      <Badge colorScheme="green" mr={3}>Approved</Badge>
      <Text color="green.700">
        Access to {approvalStatus.total_companies_access || 0} companies and {approvalStatus.total_branches_access || 0} branches
      </Text>
    </Flex>
  )
}

function EnhancedAdminExample() {
  return (
    <Container maxW="full">
      <VStack gap={6} alignItems="stretch">
        <Heading size="lg">
          Enhanced Users Management Demo
        </Heading>

        {/* Show current user's approval status */}
        <UserApprovalBanner />

        {/* Add User Button */}
        <Box>
          <Button colorScheme="blue" mb={4}>
            Add New User
          </Button>
        </Box>

        <EnhancedUsersTable />
        
        {/* Usage instructions */}
        <Flex p={4} bg="blue.50" borderRadius="md" direction="column">
          <Heading size="sm" color="blue.700" mb={2}>
            Enhanced User Management Features
          </Heading>
          <Text color="blue.600" fontSize="sm">
            This interface demonstrates the enhanced user management API using real services:
          </Text>
          <Box as="ul" ml={5} color="blue.600" fontSize="sm">
            <li>User approval status tracking via Enhanced Users Service</li>
            <li>Extended user profiles from real API endpoints</li>
            <li>Live data updates with React Query</li>
            <li>Resource access management integration</li>
            <li>SuperAdmin role detection from authentication</li>
          </Box>
          <Text color="blue.600" fontSize="sm" mt={2}>
            See <code>ENHANCED_USER_API_DOCUMENTATION.md</code> for complete API integration examples.
          </Text>
        </Flex>
      </VStack>
    </Container>
  )
}

export default EnhancedAdminExample
