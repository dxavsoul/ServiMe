import {
  Button,
  Flex,
  Table,
  Text,
  Badge,
  VStack,
  Box,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiUsers } from "react-icons/fi"

import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { MenuItem } from "../ui/menu"
import { BranchUsersService } from "../../client/branch-users-service"
import type { BranchUserPublic } from "../../client/branch-users"
import { BranchUserActionsMenu } from "./BranchUserActionsMenu"
import AssignUserToBranch from "./AssignUserToBranch"

const PER_PAGE = 10

interface ManageBranchUsersProps {
  branchId: string
  branchName: string
}

const ManageBranchUsers = ({ branchId, branchName }: ManageBranchUsersProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["branch-users", branchId, page],
    queryFn: () =>
      BranchUsersService.getBranchUsers({
        branch_id: branchId,
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    enabled: isOpen && !!branchId,
    retry: 1, // Only retry once to avoid too many failed requests
    retryDelay: 1000,
  })

  const hasUsers = users?.data && users.data.length > 0

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "red"
      case "manager":
        return "blue"
      case "employee":
        return "green"
      default:
        return "gray"
    }
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["branch-users", branchId, page],
    })
  }

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <MenuItem value="manage-users" gap={2} py={2} style={{ cursor: "pointer" }}>
          <FiUsers fontSize="16px" />
          <Box flex="1">Manage Users</Box>
        </MenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Branch Users</DialogTitle>
          <Text fontSize="md" color="gray.600">
            Branch: <strong>{branchName}</strong>
          </Text>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Flex justify="flex-start">
              <AssignUserToBranch branchId={branchId} branchName={branchName} />
            </Flex>

            {isLoading ? (
              <Text>Loading users...</Text>
            ) : isError ? (
              <VStack gap={4} align="center" py={8}>
                <Text color="red.500" fontSize="lg">Error loading users</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  {error?.message || "Failed to fetch branch users"}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Branch ID: {branchId}
                </Text>
                <VStack gap={2}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    colorPalette="blue"
                  >
                    Try Again
                  </Button>
                  <Text fontSize="xs" color="orange.500" textAlign="center">
                    Note: Please ensure you are logged in to access branch user data.
                  </Text>
                </VStack>
              </VStack>
            ) : (
              <>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Total users: {users?.count || 0} | Showing: {users?.data?.length || 0}
                </Text>
                {hasUsers ? (
                  <>
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>User</Table.ColumnHeader>
                          <Table.ColumnHeader>Email</Table.ColumnHeader>
                          <Table.ColumnHeader>Role</Table.ColumnHeader>
                          <Table.ColumnHeader>Actions</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {users?.data?.map((branchUser: BranchUserPublic) => (
                          <Table.Row key={branchUser.user_id}>
                            <Table.Cell>
                              {branchUser.user?.full_name || branchUser.user?.email || "Unknown User"}
                            </Table.Cell>
                            <Table.Cell>{branchUser.user?.email || "N/A"}</Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette={getRoleBadgeColor(branchUser.role)}>
                                {branchUser.role}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <BranchUserActionsMenu
                                branchId={branchId}
                                userId={branchUser.user_id}
                                currentRole={branchUser.role}
                                userName={branchUser.user?.full_name || branchUser.user?.email}
                                branchName={branchName}
                              />
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                    
                    {users?.data && users.data.length === PER_PAGE && (
                      <Flex justify="space-between" align="center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Text fontSize="sm">Page {page}</Text>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={!users?.data || users.data.length < PER_PAGE}
                        >
                          Next
                        </Button>
                      </Flex>
                    )}
                  </>
                ) : (
                  <VStack gap={3} align="center" py={8}>
                    <FiUsers size={48} color="gray" />
                    <Text textAlign="center" color="gray.500" fontSize="lg">
                      No users assigned to this branch yet
                    </Text>
                    <Text textAlign="center" color="gray.400" fontSize="sm">
                      Use the "Assign User" button above to add users to this branch
                    </Text>
                  </VStack>
                )}
              </>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Close</Button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default ManageBranchUsers
