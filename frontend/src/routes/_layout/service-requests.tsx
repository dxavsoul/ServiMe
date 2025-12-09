import { createFileRoute } from "@tanstack/react-router"
import {
  Container,
  Heading,
  Table,
  VStack,
  Text,
  HStack,
  Badge,
  Button,
  Input,
  Textarea,
  Card,
  Box,
} from "@chakra-ui/react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { 
  FiEdit, 
  FiClock, 
  FiTool
} from "react-icons/fi"
import { 
  type ServiceRequestPublic, 
  type ServiceRequestUpdate
} from "../../client"

// Import dialog components
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogActionTrigger,
} from "../../components/ui/dialog"

import { Field } from "../../components/ui/field"
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/service-requests")({
  component: ServiceRequestsPage,
})

function ServiceRequestsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [editingRequest, setEditingRequest] = useState<ServiceRequestPublic | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Form state for editing
  const [editForm, setEditForm] = useState<ServiceRequestUpdate>({})

  // Mock data for demonstration (since API endpoints don't exist yet)
  const mockServiceRequests: ServiceRequestPublic[] = [
    {
      id: "1",
      service_id: "service-1",
      customer_id: "customer-1",
      branch_id: "branch-1",
      description: "Need plumbing repair for kitchen sink",
      preferred_date: "2025-08-15",
      preferred_time: "10:00",
      urgent: true,
      customer_latitude: -0.185653,
      customer_longitude: -78.472834,
      status: "pending",
      created_at: "2025-08-10T09:00:00Z",
      updated_at: "2025-08-10T09:00:00Z",
      service: {
        id: "service-1",
        name: "Plumbing Repair",
        description: "Professional plumbing services",
        price: "75.00",
        duration_minutes: 120
      },
      customer: {
        id: "customer-1",
        email: "john.doe@example.com",
        full_name: "John Doe",
        phone_number: "+1-555-0123"
      },
      branch: {
        id: "branch-1",
        name: "Downtown Branch",
        address: "123 Main St, City Center",
        phone_number: "+1-555-0100"
      }
    },
    {
      id: "2",
      service_id: "service-2",
      customer_id: "customer-2",
      branch_id: null,
      description: "Electrical installation for new apartment",
      preferred_date: "2025-08-16",
      preferred_time: "14:00",
      urgent: false,
      customer_latitude: -0.195653,
      customer_longitude: -78.482834,
      status: "accepted",
      created_at: "2025-08-09T14:30:00Z",
      updated_at: "2025-08-10T08:15:00Z",
      service: {
        id: "service-2",
        name: "Electrical Installation",
        description: "Complete electrical setup",
        price: "150.00",
        duration_minutes: 180
      },
      customer: {
        id: "customer-2",
        email: "jane.smith@example.com",
        full_name: "Jane Smith",
        phone_number: "+1-555-0124"
      }
    },
    {
      id: "3",
      service_id: "service-3",
      customer_id: "customer-3",
      branch_id: "branch-2",
      description: "HVAC maintenance and cleaning",
      preferred_date: "2025-08-17",
      preferred_time: "09:00",
      urgent: false,
      customer_latitude: -0.175653,
      customer_longitude: -78.462834,
      status: "in_progress",
      created_at: "2025-08-08T11:20:00Z",
      updated_at: "2025-08-11T07:45:00Z",
      service: {
        id: "service-3",
        name: "HVAC Maintenance",
        description: "Heating and cooling system service",
        price: "120.00",
        duration_minutes: 150
      },
      customer: {
        id: "customer-3",
        email: "mike.wilson@example.com",
        full_name: "Mike Wilson",
        phone_number: "+1-555-0125"
      },
      branch: {
        id: "branch-2",
        name: "Northside Branch",
        address: "456 Oak Ave, North District",
        phone_number: "+1-555-0200"
      }
    },
    {
      id: "4",
      service_id: "service-4",
      customer_id: "customer-4",
      branch_id: "branch-1",
      description: "Carpet cleaning for office space",
      preferred_date: "2025-08-18",
      preferred_time: "11:30",
      urgent: false,
      customer_latitude: -0.165653,
      customer_longitude: -78.452834,
      status: "completed",
      created_at: "2025-08-07T16:45:00Z",
      updated_at: "2025-08-10T14:20:00Z",
      service: {
        id: "service-4",
        name: "Carpet Cleaning",
        description: "Professional carpet cleaning services",
        price: "90.00",
        duration_minutes: 90
      },
      customer: {
        id: "customer-4",
        email: "sarah.johnson@company.com",
        full_name: "Sarah Johnson",
        phone_number: "+1-555-0126"
      },
      branch: {
        id: "branch-1",
        name: "Downtown Branch",
        address: "123 Main St, City Center",
        phone_number: "+1-555-0100"
      }
    },
    {
      id: "5",
      service_id: "service-5",
      customer_id: "customer-5",
      branch_id: null,
      description: "Home security system installation",
      preferred_date: "2025-08-19",
      preferred_time: "13:00",
      urgent: true,
      customer_latitude: -0.205653,
      customer_longitude: -78.492834,
      status: "cancelled",
      created_at: "2025-08-06T12:30:00Z",
      updated_at: "2025-08-09T09:10:00Z",
      service: {
        id: "service-5",
        name: "Security Installation",
        description: "Complete home security setup",
        price: "300.00",
        duration_minutes: 240
      },
      customer: {
        id: "customer-5",
        email: "robert.brown@email.com",
        full_name: "Robert Brown",
        phone_number: "+1-555-0127"
      }
    }
  ]

  // Filter by status first
  const statusFilteredRequests = statusFilter 
    ? mockServiceRequests.filter(request => request.status === statusFilter)
    : mockServiceRequests

  // Then filter by search term
  const filteredRequests = statusFilteredRequests.filter((request) =>
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.service?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Update service request mutation (mock for now)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceRequestUpdate }) => {
      // Mock API call - just return updated data
      return Promise.resolve({
        ...mockServiceRequests.find(r => r.id === id),
        ...data,
        updated_at: new Date().toISOString()
      })
    },
    onSuccess: () => {
      showSuccessToast("Service request updated successfully.")
      setIsEditDialogOpen(false)
      setEditingRequest(null)
    },
    onError: () => {
      showErrorToast("Failed to update service request.")
    },
  })

  const handleEdit = (request: ServiceRequestPublic) => {
    setEditingRequest(request)
    setEditForm({
      description: request.description,
      status: request.status,
      urgent: request.urgent,
      preferred_date: request.preferred_date || undefined,
      preferred_time: request.preferred_time || undefined,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingRequest) return
    updateMutation.mutate({
      id: editingRequest.id,
      data: editForm,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "yellow"
      case "accepted":
        return "blue"
      case "in_progress":
        return "orange"
      case "completed":
        return "green"
      case "cancelled":
        return "red"
      default:
        return "gray"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <Heading size="lg">Service Requests Management</Heading>

        {/* Demo Mode Notice */}
        <Card.Root borderColor="orange.200" bg="orange.50">
          <Card.Body>
            <HStack gap={2}>
              <Badge colorScheme="orange">Demo Mode</Badge>
              <Text fontSize="sm" color="orange.800">
                Service Requests API endpoints are not implemented yet. Showing mock data for demonstration.
              </Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Filters */}
        <HStack gap={4}>
          <Box flex={1}>
            <Input
              placeholder="Search by description, customer, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
          <Box minW="200px">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                padding: "8px", 
                borderRadius: "4px", 
                border: "1px solid #ccc",
                minWidth: "150px" 
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Box>
        </HStack>

        {/* Service Requests Table */}
        {filteredRequests.length === 0 ? (
          <Card.Root>
            <Card.Body textAlign="center" py={8}>
              <FiTool size={48} style={{ margin: "0 auto 16px" }} />
              <Text fontWeight="bold" fontSize="lg">No service requests found</Text>
              <Text color="gray.600">No service requests match your current filters.</Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Customer</Table.ColumnHeader>
                <Table.ColumnHeader>Service</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Date/Time</Table.ColumnHeader>
                <Table.ColumnHeader>Branch</Table.ColumnHeader>
                <Table.ColumnHeader>Priority</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredRequests.map((request) => (
                <Table.Row key={request.id}>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="medium">
                        {request.customer?.full_name || "Unknown"}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {request.customer?.email}
                      </Text>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="medium">
                        {request.service?.name || "Unknown Service"}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        ${request.service?.price}
                      </Text>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" maxW="300px" truncate>
                      {request.description}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={getStatusColor(request.status)}>
                      {request.status.replace("_", " ")}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      {request.preferred_date && (
                        <Text fontSize="sm">
                          <FiClock style={{ display: "inline", marginRight: "4px" }} />
                          {formatDate(request.preferred_date)}
                        </Text>
                      )}
                      {request.preferred_time && (
                        <Text fontSize="sm" color="gray.600">
                          {formatTime(request.preferred_time)}
                        </Text>
                      )}
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    {request.branch ? (
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {request.branch.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {request.branch.address}
                        </Text>
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        Not assigned
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {request.urgent && (
                      <Badge colorScheme="red" size="sm">
                        Urgent
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(request)}
                      >
                        <FiEdit />
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Edit Dialog */}
        <DialogRoot
          open={isEditDialogOpen}
          onOpenChange={(e) => setIsEditDialogOpen(e.open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service Request</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack gap={4}>
                <Field label="Description">
                  <Textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="Service request description"
                  />
                </Field>
                
                <Field label="Status">
                  <select
                    value={editForm.status || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    style={{ 
                      padding: "8px", 
                      borderRadius: "4px", 
                      border: "1px solid #ccc",
                      width: "100%" 
                    }}
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>

                <Field label="Preferred Date">
                  <Input
                    type="date"
                    value={editForm.preferred_date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, preferred_date: e.target.value })
                    }
                  />
                </Field>

                <Field label="Preferred Time">
                  <Input
                    type="time"
                    value={editForm.preferred_time || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, preferred_time: e.target.value })
                    }
                  />
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </DialogActionTrigger>
              <Button
                onClick={handleUpdate}
                loading={updateMutation.isPending}
                disabled={!editForm.description}
              >
                Update Request
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>
      </VStack>
    </Container>
  )
}

export default ServiceRequestsPage
