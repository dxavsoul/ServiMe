import {
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Text,
  Badge,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { BranchUsersService } from "../../client/branch-users-service"
import { BranchesService } from "../../client"
import type { BranchUserPublic } from "../../client/branch-users"
import { BranchUserActionsMenu } from "./BranchUserActionsMenu"
import AssignUserToBranch from "./AssignUserToBranch"

const PER_PAGE = 5

function getUsersQueryOptions({ 
  branchId, 
  page 
}: { 
  branchId: string
  page: number 
}) {
  return {
    queryFn: () =>
      BranchUsersService.getBranchUsers({
        branch_id: branchId,
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    queryKey: ["branch-users", branchId, page],
  }
}

interface BranchUsersProps {
  branchId: string
}

const BranchUsers = ({ branchId }: BranchUsersProps) => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    ...getUsersQueryOptions({ branchId, page }),
  })

  const {
    data: branchData,
    isLoading: isBranchLoading,
  } = useQuery({
    queryKey: ["branches", branchId, "details"],
    queryFn: () => BranchesService.readBranchWithDetails({ id: branchId }),
    enabled: !!branchId,
  })

  const hasUsers = users?.data && users.data.length > 0

  useEffect(() => {
    if (isError) {
      navigate({ to: "/branches" })
    }
  }, [isError, navigate])

  if (isLoading || isBranchLoading) {
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

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Branch Users
      </Heading>
      
      {branchData && (
        <Flex mb={4} gap={2} flexDirection={{ base: "column", md: "row" }}>
          <Text fontSize="md" color="gray.600">
            Branch: <strong>{branchData.name}</strong>
          </Text>
          {branchData.company_name && (
            <Text fontSize="md" color="gray.600">
              Company: <strong>{branchData.company_name}</strong>
            </Text>
          )}
        </Flex>
      )}

      <Flex py={8} gap={4} flexDirection={{ base: "column", md: "row" }}>
        <AssignUserToBranch branchId={branchId} branchName={branchData?.name} />
      </Flex>

      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          {hasUsers ? (
            <>
              <Table.Root size={{ base: "sm", md: "md" }}>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>User</Table.ColumnHeader>
                    <Table.ColumnHeader>Email</Table.ColumnHeader>
                    <Table.ColumnHeader>Role</Table.ColumnHeader>
                    <Table.ColumnHeader>Assigned Date</Table.ColumnHeader>
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
                        {branchUser.assigned_at 
                          ? new Date(branchUser.assigned_at).toLocaleDateString()
                          : "N/A"}
                      </Table.Cell>
                      <Table.Cell>
                        <BranchUserActionsMenu
                          branchId={branchId}
                          userId={branchUser.user_id}
                          currentRole={branchUser.role}
                          userName={branchUser.user?.full_name || branchUser.user?.email}
                          branchName={branchData?.name}
                        />
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
                  disabled={!users?.data || users.data.length < PER_PAGE}
                >
                  Next
                </Button>
              </Flex>
            </>
          ) : (
            <Text>No users assigned to this branch.</Text>
          )}
        </>
      )}
    </Container>
  )
}

export default BranchUsers
