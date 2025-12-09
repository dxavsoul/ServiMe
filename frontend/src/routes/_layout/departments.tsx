import { createFileRoute } from "@tanstack/react-router"
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
  Card,
  Input,
  Textarea,
} from "@chakra-ui/react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FiSearch, FiClock, FiEdit, FiPlus, FiArrowLeft, FiTrash2 } from "react-icons/fi"
import { BranchesService, DepartmentsService, DepartmentHoursService, type BranchWithLocationPublic } from "../../client"
import type { DepartmentPublic, DepartmentHourPublic } from "../../client/departments"
import useCustomToast from "../../hooks/useCustomToast"

// Import dialog components
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogActionTrigger,
} from "../../components/ui/dialog"
import { Field } from "../../components/ui/field"
import { Checkbox } from "../../components/ui/checkbox"

// AddDepartment component
function AddDepartment({ 
  onAdd, 
  branches, 
  branchesLoading 
}: { 
  onAdd: (department: DepartmentPublic) => void
  branches: (BranchWithLocationPublic & { company_name: string })[]
  branchesLoading: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    branch_id: "", // Empty by default to force selection
  })

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Mutation for creating department
  const createDepartmentMutation = useMutation({
    mutationFn: (newDepartment: any) => {
      console.log("Creating department with data:", newDepartment)
      return DepartmentsService.createDepartment({ requestBody: newDepartment })
    },
    onSuccess: (data) => {
      console.log("Department created successfully:", data)
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      // Add to local state for immediate UI update
      onAdd(data)
      // Show success message
      showSuccessToast("Department created successfully")
      // Close modal and reset form
      setIsOpen(false)
      setFormData({
        name: "",
        description: "",
        is_active: true,
        branch_id: "",
      })
    },
    onError: (error: any) => {
      console.error("Error creating department:", error)
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        body: error.body,
        url: error.url
      })
      showErrorToast(`Failed to create department: ${error.message || "Please try again."}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      showErrorToast("Please enter a department name")
      return
    }
    
    if (!formData.branch_id) {
      showErrorToast("Please select a branch")
      return
    }
    
    // Create department data for API
    const departmentData = {
      name: formData.name,
      description: formData.description || null,
      is_active: formData.is_active,
      branch_id: formData.branch_id,
    }

    // Use mutation to create department
    createDepartmentMutation.mutate(departmentData)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogTrigger asChild>
        <Button>
          <FiPlus />
          Add Department
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  type="text"
                  required
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter department description (optional)"
                  rows={3}
                />
              </Field>

              <Field label="Branch" required>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  required
                  disabled={branchesLoading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">
                    {branchesLoading ? "Loading branches..." : "Select a branch"}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.company_name && `(${branch.company_name})`}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <HStack>
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(details) => 
                      setFormData({ ...formData, is_active: !!details.checked })
                    }
                  />
                  <Text>Active</Text>
                </HStack>
              </Field>
            </VStack>
          </form>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={createDepartmentMutation.isPending}
            disabled={createDepartmentMutation.isPending}
          >
            {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// EditDepartment component
function EditDepartment({ 
  department,
  onUpdate, 
  branches, 
  branchesLoading 
}: { 
  department: DepartmentPublic
  onUpdate: (department: DepartmentPublic) => void
  branches: (BranchWithLocationPublic & { company_name: string })[]
  branchesLoading: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: department.name,
    description: department.description || "",
    is_active: department.is_active,
    branch_id: department.branch_id,
  })

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Mutation for updating department
  const updateDepartmentMutation = useMutation({
    mutationFn: (updatedDepartment: any) => {
      console.log("Updating department with data:", updatedDepartment)
      console.log("Department ID:", department.id)
      return DepartmentsService.updateDepartment({ 
        id: department.id, 
        requestBody: updatedDepartment 
      })
    },
    onSuccess: (data) => {
      console.log("Department updated successfully:", data)
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      // Update local state for immediate UI update
      onUpdate(data)
      // Show success message
      showSuccessToast("Department updated successfully")
      // Close modal and reset form
      setIsOpen(false)
    },
    onError: (error: any) => {
      console.error("Error updating department:", error)
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        body: error.body,
        url: error.url,
        departmentId: department.id
      })
      showErrorToast(`Failed to update department: ${error.message || "Unknown error"}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      showErrorToast("Please enter a department name")
      return
    }
    
    if (!formData.branch_id) {
      showErrorToast("Please select a branch")
      return
    }
    
    // Create department data for API
    const departmentData = {
      name: formData.name,
      description: formData.description || null,
      is_active: formData.is_active,
      branch_id: formData.branch_id,
    }

    // Use mutation to update department
    updateDepartmentMutation.mutate(departmentData)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <FiEdit />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  type="text"
                  required
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter department description (optional)"
                  rows={3}
                />
              </Field>

              <Field label="Branch" required>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  required
                  disabled={branchesLoading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">
                    {branchesLoading ? "Loading branches..." : "Select a branch"}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.company_name && `(${branch.company_name})`}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <HStack>
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(details) => 
                      setFormData({ ...formData, is_active: !!details.checked })
                    }
                  />
                  <Text>Active</Text>
                </HStack>
              </Field>
            </VStack>
          </form>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={updateDepartmentMutation.isPending}
            disabled={updateDepartmentMutation.isPending}
          >
            {updateDepartmentMutation.isPending ? "Updating..." : "Update Department"}
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// DeleteDepartment component
function DeleteDepartment({ 
  department,
  onDelete 
}: { 
  department: DepartmentPublic
  onDelete: (departmentId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Mutation for deleting department
  const deleteDepartmentMutation = useMutation({
    mutationFn: (departmentId: string) => {
      console.log("Deleting department with ID:", departmentId)
      return DepartmentsService.deleteDepartment({ id: departmentId })
    },
    onSuccess: (data) => {
      console.log("Department deleted successfully:", data)
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      // Update local state for immediate UI update
      onDelete(department.id)
      // Show success message
      showSuccessToast("Department deleted successfully")
      // Close modal
      setIsOpen(false)
    },
    onError: (error: any) => {
      console.error("Error deleting department:", error)
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        body: error.body,
        url: error.url,
        departmentId: department.id
      })
      showErrorToast(`Failed to delete department: ${error.message || "Unknown error"}`)
    }
  })

  const handleDelete = () => {
    deleteDepartmentMutation.mutate(department.id)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" colorScheme="red">
          <FiTrash2 />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="start">
            <Text>
              Are you sure you want to delete the department "{department.name}"?
            </Text>
            <Text color="red.500" fontSize="sm">
              This action cannot be undone. All associated data will be permanently removed.
            </Text>
          </VStack>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            colorScheme="red"
            onClick={handleDelete}
            loading={deleteDepartmentMutation.isPending}
            disabled={deleteDepartmentMutation.isPending}
          >
            {deleteDepartmentMutation.isPending ? "Deleting..." : "Delete Department"}
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// AddDayHours component
function AddDayHours({ 
  department,
  existingHour,
  preSelectedDay,
  onSave 
}: { 
  department: DepartmentPublic
  existingHour?: DepartmentHourPublic
  preSelectedDay?: string
  onSave: (hour: DepartmentHourPublic) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { showErrorToast } = useCustomToast()
  const [formData, setFormData] = useState({
    day_of_week: existingHour?.day_of_week || preSelectedDay || "",
    open_time: existingHour?.open_time || "09:00:00",
    close_time: existingHour?.close_time || "17:00:00",
    is_closed: existingHour?.is_closed || false,
  })

  const daysOfWeek = [
    "monday", "tuesday", "wednesday", "thursday", 
    "friday", "saturday", "sunday"
  ] as const

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.day_of_week) {
      showErrorToast("Please select a day")
      return
    }

    if (!formData.is_closed && (!formData.open_time || !formData.close_time)) {
      showErrorToast("Please set both open and close times, or mark the day as closed")
      return
    }

    const hourData: DepartmentHourPublic = {
      id: existingHour?.id || `${Math.random().toString(36).substr(2, 9)}`,
      day_of_week: formData.day_of_week as DepartmentHourPublic["day_of_week"],
      open_time: formData.is_closed ? null : formData.open_time,
      close_time: formData.is_closed ? null : formData.close_time,
      is_closed: formData.is_closed,
      department_id: department.id,
    }

    onSave(hourData)
    setIsOpen(false)
    
    // Reset form if adding new
    if (!existingHour) {
      setFormData({
        day_of_week: preSelectedDay || "",
        open_time: "09:00:00",
        close_time: "17:00:00",
        is_closed: false,
      })
    }
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={existingHour ? "outline" : "solid"}>
          <FiPlus />
          {existingHour ? "Edit Hours" : "Add Day"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingHour ? "Edit Day Hours" : "Add Day Hours"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Day of Week" required>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  required
                  disabled={!!existingHour || !!preSelectedDay} // Don't allow changing day when editing or pre-selected
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: (existingHour || preSelectedDay) ? "#f7fafc" : "white"
                  }}
                >
                  <option value="">Select a day</option>
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <HStack>
                  <Checkbox
                    checked={formData.is_closed}
                    onCheckedChange={(details) => 
                      setFormData({ ...formData, is_closed: !!details.checked })
                    }
                  />
                  <Text>Closed on this day</Text>
                </HStack>
              </Field>

              {!formData.is_closed && (
                <>
                  <Field label="Open Time" required>
                    <Input
                      type="time"
                      value={formData.open_time}
                      onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                      required={!formData.is_closed}
                    />
                  </Field>

                  <Field label="Close Time" required>
                    <Input
                      type="time"
                      value={formData.close_time}
                      onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                      required={!formData.is_closed}
                    />
                  </Field>
                </>
              )}
            </VStack>
          </form>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
          >
            {existingHour ? "Update Hours" : "Add Hours"}
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// Schedule component
function DepartmentSchedule({ department, onBack }: { department: DepartmentPublic, onBack: () => void }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Validate department ID format (should be UUID)
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // Debug department info
  console.log("Department schedule for:", department)
  console.log("Department ID is valid UUID:", isValidUUID(department.id))

  // Fetch department hours from API - using department with hours endpoint as fallback
  const { data: hoursData, isLoading: hoursLoading, error: hoursError } = useQuery({
    queryKey: ["department-hours", department.id],
    queryFn: async () => {
      console.log("Fetching department hours for:", department.id)
      console.log("Department details:", { id: department.id, name: department.name })
      
      // Validate UUID format first
      if (!isValidUUID(department.id)) {
        throw new Error(`Invalid department ID format: ${department.id}`)
      }
      
      try {
        // Try the direct hours endpoint first
        const result = await DepartmentHoursService.readDepartmentHours({ department_id: department.id })
        console.log("Department hours fetch successful:", result)
        return result
      } catch (error) {
        console.error("Department hours fetch error:", error)
        console.error("Error details:", {
          message: (error as any)?.message,
          status: (error as any)?.status,
          body: (error as any)?.body,
          url: (error as any)?.url
        })
        
        // Try alternative approach: get department with hours
        try {
          console.log("Trying alternative: fetching department with hours")
          const deptWithHours = await DepartmentsService.readDepartmentWithHours({ id: department.id })
          console.log("Department with hours fetch successful:", deptWithHours)
          return { data: deptWithHours.hours || [], count: deptWithHours.hours?.length || 0 }
        } catch (altError) {
          console.error("Alternative fetch also failed:", altError)
          
          // If both fail with 404 or 422, return empty data
          if (((error as any)?.status === 404 || (error as any)?.status === 422) ||
              ((altError as any)?.status === 404 || (altError as any)?.status === 422)) {
            console.log("No hours found for department, returning empty array")
            return { data: [], count: 0 }
          }
          
          throw error // Throw original error
        }
      }
    },
    retry: false, // Don't retry on error to avoid spam
  })

  // Log errors for debugging
  if (hoursError) {
    console.error("Hours query error:", hoursError)
  }

  // Get hours from API data
  const hours = hoursData?.data || []

  const daysOfWeek = [
    "monday", "tuesday", "wednesday", "thursday", 
    "friday", "saturday", "sunday"
  ] as const

  // Mutation for creating/updating department hours
  const saveHoursMutation = useMutation({
    mutationFn: (hourData: DepartmentHourPublic) => {
      console.log("Saving department hours:", hourData)
      // Check if this day already has hours
      const existingHour = hours.find(h => h.day_of_week === hourData.day_of_week)
      
      if (existingHour) {
        // Update existing hours
        return DepartmentHoursService.updateDayHours({
          department_id: department.id,
          day_of_week: hourData.day_of_week,
          requestBody: {
            day_of_week: hourData.day_of_week,
            open_time: hourData.open_time,
            close_time: hourData.close_time,
            is_closed: hourData.is_closed,
            department_id: department.id, // Include department_id in request body
          }
        })
      } else {
        // Create new hours
        return DepartmentHoursService.createSingleDayHours({
          department_id: department.id,
          requestBody: {
            day_of_week: hourData.day_of_week,
            open_time: hourData.open_time,
            close_time: hourData.close_time,
            is_closed: hourData.is_closed,
            department_id: department.id, // Include department_id in request body
          }
        })
      }
    },
    onSuccess: (data) => {
      console.log("Department hours saved successfully:", data)
      // Invalidate hours query to refresh data
      queryClient.invalidateQueries({ queryKey: ["department-hours", department.id] })
      showSuccessToast("Department hours updated successfully")
    },
    onError: (error: any) => {
      console.error("Error saving department hours:", error)
      showErrorToast(`Failed to save hours: ${error.message || "Unknown error"}`)
    }
  })

  // Mutation for deleting day hours
  const deleteHoursMutation = useMutation({
    mutationFn: (day_of_week: string) => {
      console.log("Deleting department hours for day:", day_of_week)
      return DepartmentHoursService.deleteDayHours({
        department_id: department.id,
        day_of_week: day_of_week,
      })
    },
    onSuccess: (data) => {
      console.log("Department hours deleted successfully:", data)
      // Invalidate hours query to refresh data
      queryClient.invalidateQueries({ queryKey: ["department-hours", department.id] })
      showSuccessToast("Department hours deleted successfully")
    },
    onError: (error: any) => {
      console.error("Error deleting department hours:", error)
      showErrorToast(`Failed to delete hours: ${error.message || "Unknown error"}`)
    }
  })

  // Function to handle deleting hours for a day
  const handleDeleteHours = (day_of_week: string) => {
    if (window.confirm(`Are you sure you want to delete the hours for ${day_of_week}?`)) {
      deleteHoursMutation.mutate(day_of_week)
    }
  }

  // Function to handle saving/updating hours
  const handleSaveHours = (newHour: DepartmentHourPublic) => {
    saveHoursMutation.mutate(newHour)
  }

  // Function to get available days for adding new hours
  const getAvailableDays = () => {
    const usedDays = hours.map(h => h.day_of_week)
    return daysOfWeek.filter(day => !usedDays.includes(day))
  }

  const formatTime = (time: string | null) => {
    if (!time) return "N/A"
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getHourForDay = (day: string) => {
    return hours.find(hour => hour.day_of_week === day)
  }

  return (
    <Container maxW="4xl">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Card.Root>
          <Card.Header>
            <HStack justify="space-between" align="start">
              <VStack align="start" gap={2}>
                <HStack align="center" gap={3}>
                  <FiClock size="24px" />
                  <Heading size="lg">Department Schedule</Heading>
                </HStack>
                <Text color="gray.500" fontSize="sm">
                  Manage operating hours for {department.name}
                </Text>
              </VStack>
              <HStack gap={2}>
                <Button variant="outline" onClick={onBack}>
                  <FiArrowLeft />
                  Back to Departments
                </Button>
                {getAvailableDays().length > 0 && (
                  <AddDayHours 
                    department={department}
                    onSave={handleSaveHours}
                  />
                )}
              </HStack>
            </HStack>
          </Card.Header>
        </Card.Root>

        {/* Schedule Overview */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Heading size="md">Current Schedule</Heading>
              
              {hoursLoading ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  Loading schedule...
                </Text>
              ) : hoursError ? (
                <VStack textAlign="center" py={8}>
                  <Text color="red.500">
                    Failed to load schedule.
                  </Text>
                  <Text color="gray.500" fontSize="sm">
                    Error: {(hoursError as any)?.message || "Unknown error"}
                    {(hoursError as any)?.status && ` (Status: ${(hoursError as any).status})`}
                  </Text>
                  <Button size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["department-hours", department.id] })}>
                    Try Again
                  </Button>
                </VStack>
              ) : hours.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  No schedule configured yet. Add operating hours to get started.
                </Text>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Day</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Open Time</Table.ColumnHeader>
                      <Table.ColumnHeader>Close Time</Table.ColumnHeader>
                      <Table.ColumnHeader>Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {daysOfWeek.map((day) => {
                      const dayHour = getHourForDay(day)
                      return (
                        <Table.Row key={day}>
                          <Table.Cell>
                            <Text fontWeight="medium" textTransform="capitalize">
                              {day}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? (
                              <Badge 
                                variant={dayHour.is_closed ? "subtle" : "solid"}
                                colorScheme={dayHour.is_closed ? "gray" : "green"}
                              >
                                {dayHour.is_closed ? "Closed" : "Open"}
                              </Badge>
                            ) : (
                              <Badge variant="subtle" colorScheme="gray">
                                Not Set
                              </Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? formatTime(dayHour.open_time) : "N/A"}
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? formatTime(dayHour.close_time) : "N/A"}
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? (
                              <HStack gap={1}>
                                <AddDayHours
                                  department={department}
                                  existingHour={dayHour}
                                  onSave={handleSaveHours}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteHours(day)}
                                  loading={deleteHoursMutation.isPending}
                                  disabled={deleteHoursMutation.isPending}
                                >
                                  <FiTrash2 />
                                </Button>
                              </HStack>
                            ) : (
                              <AddDayHours
                                department={department}
                                preSelectedDay={day}
                                onSave={handleSaveHours}
                              />
                            )}
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
                  </Table.Body>
                </Table.Root>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  )
}

function Departments() {
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentPublic | null>(null)

  // Debug: Check if user is authenticated
  const token = localStorage.getItem("access_token")
  console.log("Access token available:", !!token, token ? "Token present" : "No token")

  // Fetch departments using the service
  const { data: departmentsData, isLoading: departmentsLoading, error: departmentsError } = useQuery({
    queryKey: ["departments"],
    queryFn: () => {
      console.log("Fetching departments...")
      return DepartmentsService.readDepartments({ limit: 100 })
    },
  })

  // Fetch branches using the service
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => {
      console.log("Fetching branches...")
      return BranchesService.readBranchesWithDetails({ limit: 100 })
    },
  })

  // Log any errors for debugging
  if (departmentsError) {
    console.error("Departments fetch error:", departmentsError)
  }

  const departments = departmentsData?.data || []
  const branches = branchesData?.data || []

  // Function to add new department (for immediate UI update)
  const handleAddDepartment = (_newDepartment: DepartmentPublic) => {
    // This will be handled by the mutation's onSuccess which invalidates the query
    // Just keeping this for the component interface compatibility
  }

  // Function to update existing department (for immediate UI update)
  const handleUpdateDepartment = (_updatedDepartment: DepartmentPublic) => {
    // This will be handled by the mutation's onSuccess which invalidates the query
    // Just keeping this for the component interface compatibility
  }

  // Function to delete existing department (for immediate UI update)
  const handleDeleteDepartment = (_departmentId: string) => {
    // This will be handled by the mutation's onSuccess which invalidates the query
    // Just keeping this for the component interface compatibility
  }

  // Helper function to get branch name by ID
  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId)
    return branch ? branch.name : `Branch ${branchId.slice(-4)}`
  }

  // If a department is selected, show its schedule
  if (selectedDepartment) {
    return (
      <DepartmentSchedule 
        department={selectedDepartment} 
        onBack={() => setSelectedDepartment(null)}
      />
    )
  }

  // Show error state if there's an error loading departments
  if (departmentsError) {
    const isAuthError = (departmentsError as any)?.status === 401
    
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap={1}>
              <Heading size="lg">Departments</Heading>
              <Text color="gray.500">Manage departments and their schedules</Text>
            </VStack>
          </HStack>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>
                  {isAuthError ? "Authentication Required" : "Error loading departments"}
                </EmptyState.Title>
                <EmptyState.Description>
                  {isAuthError 
                    ? "Please log in to access departments. You will be redirected to the login page."
                    : "Failed to load departments. Please try refreshing the page."
                  }
                </EmptyState.Description>
                {isAuthError && (
                  <Link href="/login">
                    <Button colorScheme="blue">
                      Go to Login
                    </Button>
                  </Link>
                )}
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
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
          <AddDepartment 
            onAdd={handleAddDepartment} 
            branches={branches}
            branchesLoading={branchesLoading}
          />
        </HStack>

        {departmentsLoading ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>Loading departments...</EmptyState.Title>
                <EmptyState.Description>
                  Please wait while we fetch the departments.
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : departments.length === 0 ? (
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
                      {getBranchName(department.branch_id)}
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
                      <EditDepartment
                        department={department}
                        onUpdate={handleUpdateDepartment}
                        branches={branches}
                        branchesLoading={branchesLoading}
                      />
                      <DeleteDepartment
                        department={department}
                        onDelete={handleDeleteDepartment}
                      />
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

export const Route = createFileRoute("/_layout/departments")({
  component: Departments,
})
