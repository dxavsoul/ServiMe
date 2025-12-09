import {
  Container,
  EmptyState,
  Heading,
  Table,
  VStack,
  Text,
  Link,
  HStack,
  Badge,
  Button,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiSearch, FiClock } from "react-icons/fi"

// Use local type definition for now
interface DepartmentPublic {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
  created_by: string
}

import { DepartmentActionsMenu } from "./DepartmentActionsMenu"
import AddDepartment from "./AddDepartment"
import DepartmentSchedule from "./DepartmentSchedule"

// Mock data for demonstration
const mockDepartments: DepartmentPublic[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    name: "Emergency Department",
    description: "24/7 emergency medical services",
    is_active: true,
    branch_id: "123e4567-e89b-12d3-a456-426614174000",
    created_by: "123e4567-e89b-12d3-a456-426614174002"
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174003",
    name: "Pediatrics",
    description: "Specialized care for children and adolescents",
    is_active: true,
    branch_id: "123e4567-e89b-12d3-a456-426614174000",
    created_by: "123e4567-e89b-12d3-a456-426614174002"
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174004",
    name: "Cardiology",
    description: "Heart and cardiovascular care",
    is_active: false,
    branch_id: "123e4567-e89b-12d3-a456-426614174000",
    created_by: "123e4567-e89b-12d3-a456-426614174002"
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174005",
    name: "Radiology",
    description: "Medical imaging and diagnostic services",
    is_active: true,
    branch_id: "123e4567-e89b-12d3-a456-426614174000",
    created_by: "123e4567-e89b-12d3-a456-426614174002"
  }
]

const DepartmentsDemo = () => {
  const [departments] = useState<DepartmentPublic[]>(mockDepartments)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentPublic | null>(null)

  if (selectedDepartment) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap={1}>
              <Heading size="lg">{selectedDepartment.name}</Heading>
              <Text color="gray.500">Schedule Management</Text>
            </VStack>
            <Button 
              variant="outline" 
              onClick={() => setSelectedDepartment(null)}
            >
              Back to Departments
            </Button>
          </HStack>
          <DepartmentSchedule department={selectedDepartment} />
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="lg">Departments</Heading>
            <Text color="gray.500">Manage departments and their schedules</Text>
          </VStack>
          <AddDepartment />
        </HStack>

        {departments.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No departments found</EmptyState.Title>
                <EmptyState.Description>
                  Get started by creating your first department.
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Branch</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {departments.map((department) => (
                <Table.Row key={department.id}>
                  <Table.Cell fontWeight="medium">
                    {department.name}
                  </Table.Cell>
                  <Table.Cell>
                    <Text truncate maxW="300px">
                      {department.description || "No description"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      variant={department.is_active ? "solid" : "subtle"}
                      colorScheme={department.is_active ? "green" : "gray"}
                    >
                      {department.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Link color="blue.500" fontWeight="medium">
                      Branch {department.branch_id.slice(-4)}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDepartment(department)}
                      >
                        <FiClock />
                        Schedule
                      </Button>
                      <DepartmentActionsMenu department={department} />
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </VStack>
    </Container>
  )
}

export default DepartmentsDemo
