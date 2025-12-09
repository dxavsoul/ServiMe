import { createFileRoute } from "@tanstack/react-router"
import {
  Container,
  EmptyState,
  Heading,
  Table,
  VStack,
  Text,
  HStack,
  Badge,
  Button,
  Input,
  Textarea,
  Image,
  Card,
} from "@chakra-ui/react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  FiSearch, 
  FiEdit, 
  FiPlus, 
  FiTrash2, 
  FiImage, 
  FiClock, 
  FiDollarSign,
  FiPercent,
  FiTool
} from "react-icons/fi"
import { 
  type ServicePublic, 
  type DepartmentPublic, 
  type ServiceTypePublic,
  DepartmentsService,
  ServiceTypesService,
  ServicesService
} from "../../client"

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
import FileUpload from "../../components/Common/FileUpload"

// Mock data for demonstration
// AddService component
function AddService({ 
  onAdd,
  departments,
  serviceTypes,
  departmentsLoading,
  serviceTypesLoading
}: { 
  onAdd: (service: ServicePublic) => void
  departments: DepartmentPublic[]
  serviceTypes: ServiceTypePublic[]
  departmentsLoading: boolean
  serviceTypesLoading: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    picture_url: "",
    price: "",
    duration_minutes: 30,
    is_active: true,
    has_promotion: false,
    promotion_description: "",
    promotion_discount_percentage: "",
    promotion_start_date: "",
    promotion_end_date: "",
    department_id: "",
    service_type_id: "",
  })

  const queryClient = useQueryClient()

  // Mutation for creating service
  const createServiceMutation = useMutation({
    mutationFn: (newService: any) => ServicesService.createService({ requestBody: newService }),
    onSuccess: (data) => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ["services"] })
      // Add to local state for immediate UI update
      onAdd(data)
      // Close modal and reset form
      setIsOpen(false)
      setFormData({
        name: "",
        description: "",
        picture_url: "",
        price: "",
        duration_minutes: 30,
        is_active: true,
        has_promotion: false,
        promotion_description: "",
        promotion_discount_percentage: "",
        promotion_start_date: "",
        promotion_end_date: "",
        department_id: "",
        service_type_id: "",
      })
    },
    onError: (error) => {
      console.error("Error creating service:", error)
      alert("Failed to create service. Please try again.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert("Please enter a service name")
      return
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid price")
      return
    }
    
    if (!formData.department_id) {
      alert("Please select a department")
      return
    }
    
    if (!formData.service_type_id) {
      alert("Please select a service type")
      return
    }
    
    // Create service data for API
    const serviceData = {
      name: formData.name,
      description: formData.description || null,
      picture_url: formData.picture_url || null,
      price: formData.price,
      duration_minutes: formData.duration_minutes,
      is_active: formData.is_active,
      has_promotion: formData.has_promotion,
      promotion_description: formData.has_promotion ? (formData.promotion_description || null) : null,
      promotion_discount_percentage: formData.has_promotion ? (formData.promotion_discount_percentage || null) : null,
      promotion_start_date: formData.has_promotion ? (formData.promotion_start_date || null) : null,
      promotion_end_date: formData.has_promotion ? (formData.promotion_end_date || null) : null,
      department_id: formData.department_id,
      service_type_id: formData.service_type_id,
    }

    // Use mutation to create service
    createServiceMutation.mutate(serviceData)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "lg" }}
    >
      <DialogTrigger asChild>
        <Button>
          <FiPlus />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              {/* Basic Information */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Basic Information</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field label="Name" required>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter service name"
                        type="text"
                        required
                      />
                    </Field>

                    <Field label="Description">
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter service description (optional)"
                        rows={3}
                      />
                    </Field>

                    <FileUpload
                      label="Service Image"
                      accept="image/*"
                      currentFileUrl={formData.picture_url}
                      onFileUpload={(_fileKey: string, fileUrl: string) => setFormData({ ...formData, picture_url: fileUrl })}
                      onFileDelete={() => setFormData({ ...formData, picture_url: "" })}
                      placeholder="Upload a service image"
                      folder="services"
                      publicRead={true}
                    />
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Pricing & Duration */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Pricing & Duration</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <HStack gap={4} width="full">
                      <Field label="Price" required>
                        <Input
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                        />
                      </Field>
                      
                      <Field label="Duration (minutes)" required>
                        <Input
                          value={formData.duration_minutes}
                          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                          placeholder="30"
                          type="number"
                          min="1"
                          required
                        />
                      </Field>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Department & Service Type */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Department & Service Type</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field label="Department" required>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        required
                        disabled={departmentsLoading}
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
                          {departmentsLoading ? "Loading departments..." : "Select a department"}
                        </option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Service Type" required>
                      <select
                        value={formData.service_type_id}
                        onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
                        required
                        disabled={serviceTypesLoading}
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
                          {serviceTypesLoading ? "Loading service types..." : "Select a service type"}
                        </option>
                        {serviceTypes.map((serviceType) => (
                          <option key={serviceType.id} value={serviceType.id}>
                            {serviceType.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Promotion Settings */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Promotion Settings</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field>
                      <HStack>
                        <Checkbox
                          checked={formData.has_promotion}
                          onCheckedChange={(details) => 
                            setFormData({ ...formData, has_promotion: !!details.checked })
                          }
                        />
                        <Text>Has Promotion</Text>
                      </HStack>
                    </Field>

                    {formData.has_promotion && (
                      <>
                        <Field label="Promotion Description">
                          <Textarea
                            value={formData.promotion_description}
                            onChange={(e) => setFormData({ ...formData, promotion_description: e.target.value })}
                            placeholder="Enter promotion description"
                            rows={2}
                          />
                        </Field>

                        <Field label="Discount Percentage">
                          <Input
                            value={formData.promotion_discount_percentage}
                            onChange={(e) => setFormData({ ...formData, promotion_discount_percentage: e.target.value })}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                          />
                        </Field>

                        <HStack gap={4} width="full">
                          <Field label="Start Date">
                            <Input
                              value={formData.promotion_start_date}
                              onChange={(e) => setFormData({ ...formData, promotion_start_date: e.target.value })}
                              type="date"
                            />
                          </Field>
                          
                          <Field label="End Date">
                            <Input
                              value={formData.promotion_end_date}
                              onChange={(e) => setFormData({ ...formData, promotion_end_date: e.target.value })}
                              type="date"
                            />
                          </Field>
                        </HStack>
                      </>
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Status */}
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
            loading={createServiceMutation.isPending}
          >
            Create Service
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// EditService component
function EditService({ 
  service,
  onUpdate,
  onClose,
  departments,
  serviceTypes
}: { 
  service: ServicePublic
  onUpdate: (service: ServicePublic) => void
  onClose: () => void
  departments: DepartmentPublic[]
  serviceTypes: ServiceTypePublic[]
}) {
  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description || "",
    picture_url: service.picture_url || "",
    price: service.price,
    duration_minutes: service.duration_minutes,
    is_active: service.is_active,
    has_promotion: service.has_promotion || false,
    promotion_description: service.promotion_description || "",
    promotion_discount_percentage: service.promotion_discount_percentage || "",
    promotion_start_date: service.promotion_start_date || "",
    promotion_end_date: service.promotion_end_date || "",
    department_id: service.department_id,
    service_type_id: service.service_type_id,
  })

  const queryClient = useQueryClient()

  // Mutation for updating service
  const updateServiceMutation = useMutation({
    mutationFn: (data: { id: string; updateData: any }) => 
      ServicesService.updateService({ 
        id: data.id, 
        requestBody: data.updateData 
      }),
    onSuccess: (data) => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ["services"] })
      // Update local state for immediate UI update
      onUpdate(data)
      // Close modal
      onClose()
    },
    onError: (error) => {
      console.error("Error updating service:", error)
      alert("Failed to update service. Please try again.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert("Please enter a service name")
      return
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid price")
      return
    }
    
    // Create update data for API
    const updateData = {
      name: formData.name,
      description: formData.description || null,
      picture_url: formData.picture_url || null,
      price: formData.price,
      duration_minutes: formData.duration_minutes,
      is_active: formData.is_active,
      has_promotion: formData.has_promotion,
      promotion_description: formData.has_promotion ? (formData.promotion_description || null) : null,
      promotion_discount_percentage: formData.has_promotion ? (formData.promotion_discount_percentage || null) : null,
      promotion_start_date: formData.has_promotion ? (formData.promotion_start_date || null) : null,
      promotion_end_date: formData.has_promotion ? (formData.promotion_end_date || null) : null,
      department_id: formData.department_id,
      service_type_id: formData.service_type_id,
    }

    // Use mutation to update service
    updateServiceMutation.mutate({ 
      id: service.id, 
      updateData 
    })
  }

  return (
    <DialogRoot
      open={true}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "lg" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              {/* Basic Information */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Basic Information</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field label="Name" required>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter service name"
                        type="text"
                        required
                      />
                    </Field>

                    <Field label="Description">
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter service description (optional)"
                        rows={3}
                      />
                    </Field>

                    <FileUpload
                      label="Service Image"
                      accept="image/*"
                      currentFileUrl={formData.picture_url}
                      onFileUpload={(_fileKey: string, fileUrl: string) => setFormData({ ...formData, picture_url: fileUrl })}
                      onFileDelete={() => setFormData({ ...formData, picture_url: "" })}
                      placeholder="Upload a service image"
                      folder="services"
                      publicRead={true}
                    />
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Pricing & Duration */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Pricing & Duration</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <HStack gap={4} width="full">
                      <Field label="Price" required>
                        <Input
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                        />
                      </Field>
                      
                      <Field label="Duration (minutes)" required>
                        <Input
                          value={formData.duration_minutes}
                          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                          placeholder="30"
                          type="number"
                          min="1"
                          required
                        />
                      </Field>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Department & Service Type */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Department & Service Type</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field label="Department" required>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        required
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white"
                        }}
                      >
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Service Type" required>
                      <select
                        value={formData.service_type_id}
                        onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
                        required
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white"
                        }}
                      >
                        {serviceTypes.map((serviceType) => (
                          <option key={serviceType.id} value={serviceType.id}>
                            {serviceType.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Promotion Settings */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Promotion Settings</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field>
                      <HStack>
                        <Checkbox
                          checked={formData.has_promotion}
                          onCheckedChange={(details) => 
                            setFormData({ ...formData, has_promotion: !!details.checked })
                          }
                        />
                        <Text>Has Promotion</Text>
                      </HStack>
                    </Field>

                    {formData.has_promotion && (
                      <>
                        <Field label="Promotion Description">
                          <Textarea
                            value={formData.promotion_description}
                            onChange={(e) => setFormData({ ...formData, promotion_description: e.target.value })}
                            placeholder="Enter promotion description"
                            rows={2}
                          />
                        </Field>

                        <Field label="Discount Percentage">
                          <Input
                            value={formData.promotion_discount_percentage}
                            onChange={(e) => setFormData({ ...formData, promotion_discount_percentage: e.target.value })}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                          />
                        </Field>

                        <HStack gap={4} width="full">
                          <Field label="Start Date">
                            <Input
                              value={formData.promotion_start_date}
                              onChange={(e) => setFormData({ ...formData, promotion_start_date: e.target.value })}
                              type="date"
                            />
                          </Field>
                          
                          <Field label="End Date">
                            <Input
                              value={formData.promotion_end_date}
                              onChange={(e) => setFormData({ ...formData, promotion_end_date: e.target.value })}
                              type="date"
                            />
                          </Field>
                        </HStack>
                      </>
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Status */}
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
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={updateServiceMutation.isPending}
          >
            Update Service
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// DeleteService component
function DeleteService({ 
  service,
  onDelete,
  onClose
}: { 
  service: ServicePublic
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  // Mutation for deleting service
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => ServicesService.deleteService({ id }),
    onSuccess: () => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ["services"] })
      // Update local state for immediate UI update
      onDelete(service.id)
      // Close modal
      onClose()
    },
    onError: (error) => {
      console.error("Error deleting service:", error)
      alert("Failed to delete service. Please try again.")
    }
  })

  const handleDelete = () => {
    deleteServiceMutation.mutate(service.id)
  }

  return (
    <DialogRoot
      open={true}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "sm" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete the service "{service.name}"? 
            This action cannot be undone.
          </Text>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            colorScheme="red" 
            onClick={handleDelete}
            loading={deleteServiceMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// Utility function to format price
const formatPrice = (price: string) => {
  return `$${parseFloat(price).toFixed(2)}`
}

// Utility function to format duration
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}

// Utility function to check if promotion is active
const isPromotionActive = (service: ServicePublic) => {
  if (!service.has_promotion || !service.promotion_start_date || !service.promotion_end_date) {
    return false
  }
  
  const now = new Date()
  const startDate = new Date(service.promotion_start_date)
  const endDate = new Date(service.promotion_end_date)
  
  return now >= startDate && now <= endDate
}

function Services() {
  // Fetch services from API
  const { 
    data: servicesResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["services"],
    queryFn: () => ServicesService.readServices(),
  })

  // Extract services array from API response
  const services = servicesResponse?.data || []

  const [editingService, setEditingService] = useState<ServicePublic | null>(null)
  const [deletingService, setDeletingService] = useState<ServicePublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterServiceType, setFilterServiceType] = useState("")
  const [showPromotionsOnly, setShowPromotionsOnly] = useState(false)

  // Fetch departments and service types
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => DepartmentsService.readDepartments({ limit: 100 }),
  })

  const { data: serviceTypesData, isLoading: serviceTypesLoading } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: () => ServiceTypesService.readServiceTypes({ limit: 100 }),
  })

  const departments = departmentsData?.data || []
  const serviceTypes = serviceTypesData?.data || []

  // Function to add new service (for immediate UI updates)
  const handleAddService = (_newService: ServicePublic) => {
    // This will be handled by React Query cache invalidation
    refetch()
  }

  // Function to update service (for immediate UI updates)
  const handleUpdateService = (_updatedService: ServicePublic) => {
    // This will be handled by React Query cache invalidation in the edit component
    refetch()
  }

  // Function to delete service (for immediate UI updates)
  const handleDeleteService = (_id: string) => {
    // This will be handled by React Query cache invalidation in the delete component
    refetch()
  }

  // Handle loading state
  if (isLoading || departmentsLoading || serviceTypesLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text>Loading services...</Text>
        </VStack>
      </Container>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text color="red.500">Error loading services. Please try again.</Text>
          <Button onClick={() => refetch()}>Retry</Button>
        </VStack>
      </Container>
    )
  }

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDepartment = 
      !filterDepartment || service.department_id === filterDepartment
      
    const matchesServiceType = 
      !filterServiceType || service.service_type_id === filterServiceType
      
    const matchesPromotion = 
      !showPromotionsOnly || (service.has_promotion && isPromotionActive(service))
    
    return matchesSearch && matchesDepartment && matchesServiceType && matchesPromotion
  })

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="lg">Services</Heading>
            <Text color="gray.500">Manage services, pricing, and promotions</Text>
          </VStack>
          <AddService 
            onAdd={handleAddService}
            departments={departments}
            serviceTypes={serviceTypes}
            departmentsLoading={departmentsLoading}
            serviceTypesLoading={serviceTypesLoading}
          />
        </HStack>

        {/* Search and Filters */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4}>
              <HStack gap={4} width="full">
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxW="400px"
                />
                <Button variant="outline">
                  <FiSearch />
                </Button>
              </HStack>
              
              <HStack gap={4} width="full" wrap="wrap">
                <Field label="Department">
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      minWidth: "200px"
                    }}
                  >
                    <option value="">All Departments</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Service Type">
                  <select
                    value={filterServiceType}
                    onChange={(e) => setFilterServiceType(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      minWidth: "200px"
                    }}
                  >
                    <option value="">All Service Types</option>
                    {serviceTypes.map((serviceType) => (
                      <option key={serviceType.id} value={serviceType.id}>
                        {serviceType.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Promotions">
                  <HStack>
                    <Checkbox
                      checked={showPromotionsOnly}
                      onCheckedChange={(details) => setShowPromotionsOnly(!!details.checked)}
                    />
                    <Text fontSize="sm">Active promotions only</Text>
                  </HStack>
                </Field>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {filteredServices.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No services found</EmptyState.Title>
                <EmptyState.Description>
                  {searchTerm || filterDepartment || filterServiceType || showPromotionsOnly
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by creating your first service."}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Picture</Table.ColumnHeader>
                <Table.ColumnHeader>Service</Table.ColumnHeader>
                <Table.ColumnHeader>Department</Table.ColumnHeader>
                <Table.ColumnHeader>Service Type</Table.ColumnHeader>
                <Table.ColumnHeader>Price</Table.ColumnHeader>
                <Table.ColumnHeader>Duration</Table.ColumnHeader>
                <Table.ColumnHeader>Promotion</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredServices.map((service) => (
                <Table.Row key={service.id}>
                  <Table.Cell>
                    {service.picture_url ? (
                      <Image
                        src={service.picture_url}
                        alt={service.name}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <FiImage size={50} color="gray" />
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="medium">{service.name}</Text>
                      <Text fontSize="sm" color="gray.500" truncate maxW="200px">
                        {service.description || "No description"}
                      </Text>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">{service.department_name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <FiTool size={14} />
                      <Text fontSize="sm">{service.service_type_name}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <FiDollarSign size={14} />
                      <Text fontWeight="medium">{formatPrice(service.price)}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <FiClock size={14} />
                      <Text fontSize="sm">{formatDuration(service.duration_minutes)}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    {service.has_promotion && isPromotionActive(service) ? (
                      <VStack align="start" gap={1}>
                        <Badge variant="solid" colorScheme="orange">
                          <HStack gap={1}>
                            <FiPercent size={12} />
                            <Text>{service.promotion_discount_percentage}% OFF</Text>
                          </HStack>
                        </Badge>
                        <Text fontSize="xs" color="gray.500" truncate maxW="150px">
                          {service.promotion_description}
                        </Text>
                      </VStack>
                    ) : service.has_promotion ? (
                      <Badge variant="subtle" colorScheme="gray">
                        Inactive Promotion
                      </Badge>
                    ) : (
                      <Text fontSize="sm" color="gray.400">No promotion</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      variant={service.is_active ? "solid" : "subtle"}
                      colorScheme={service.is_active ? "green" : "gray"}
                    >
                      {service.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingService(service)}
                      >
                        <FiEdit />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        onClick={() => setDeletingService(service)}
                      >
                        <FiTrash2 />
                        Delete
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </VStack>

      {/* Edit Modal */}
      {editingService && (
        <EditService
          service={editingService}
          onUpdate={handleUpdateService}
          onClose={() => setEditingService(null)}
          departments={departments}
          serviceTypes={serviceTypes}
        />
      )}

      {/* Delete Modal */}
      {deletingService && (
        <DeleteService
          service={deletingService}
          onDelete={handleDeleteService}
          onClose={() => setDeletingService(null)}
        />
      )}
    </Container>
  )
}

export const Route = createFileRoute("/_layout/services")({
  component: Services,
})
