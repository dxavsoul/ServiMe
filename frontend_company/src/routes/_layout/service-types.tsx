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
  Box,
} from "@chakra-ui/react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FiSearch, FiEdit, FiPlus, FiTrash2, FiImage } from "react-icons/fi"
import { BiUpload, BiTrash } from "react-icons/bi"
import { ServiceTypesService, FilesService, type ServiceTypePublic } from "../../client"
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

// Mock data for demonstration

// AddServiceType component
function AddServiceType({ 
  onAdd 
}: { 
  onAdd: (serviceType: ServiceTypePublic) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  })

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Get upload config
  const { data: uploadConfig } = useQuery({
    queryKey: ["files", "config"],
    queryFn: () => FilesService.getUploadConfig(),
  })

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => FilesService.uploadFile({
      formData: {
        file,
        folder: "service-types",
        public_read: true,
      },
    }),
  })

  // Mutation for creating service type
  const createServiceTypeMutation = useMutation({
    mutationFn: (newServiceType: any) => ServiceTypesService.createServiceType({ requestBody: newServiceType }),
    onSuccess: (data) => {
      // Invalidate and refetch service types
      queryClient.invalidateQueries({ queryKey: ["serviceTypes"] })
      // Add to local state for immediate UI update
      onAdd(data)
      // Close modal and reset form
      setIsOpen(false)
      resetForm()
      showSuccessToast("Service type created successfully")
    },
    onError: (error) => {
      console.error("Error creating service type:", error)
      showErrorToast("Failed to create service type. Please try again.")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    })
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const validateFile = (file: File): string | null => {
    // Check size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return "Please select an image file"
    }

    // Check extension if we have config
    if (uploadConfig?.allowed_extensions) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const imageExtensions = uploadConfig.allowed_extensions.filter(ext => 
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
      )
      if (extension && !imageExtensions.includes(extension)) {
        return `File type not allowed. Allowed types: ${imageExtensions.join(', ')}`
      }
    }

    return null
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const error = validateFile(file)
    
    if (error) {
      showErrorToast(error)
      return
    }

    setSelectedFile(file)
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      showErrorToast("Please enter a service type name")
      return
    }
    
    try {
      let pictureUrl = null
      
      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadFileMutation.mutateAsync(selectedFile)
        pictureUrl = uploadResult.file_url
      }

      // Create service type data for API
      const serviceTypeData = {
        name: formData.name,
        description: formData.description || null,
        picture_url: pictureUrl,
        is_active: formData.is_active,
      }

      // Use mutation to create service type
      createServiceTypeMutation.mutate(serviceTypeData)
    } catch (error) {
      console.error("Error uploading file:", error)
      showErrorToast("Failed to upload picture. Please try again.")
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
        <Button>
          <FiPlus />
          Add Service Type
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service Type</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service type name"
                  type="text"
                  required
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter service type description (optional)"
                  rows={3}
                />
              </Field>

              <Field label="Picture">
                <VStack gap={3} align="stretch">
                  {/* Preview display */}
                  {previewUrl && (
                    <Box
                      p={3}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <HStack justify="space-between">
                        <HStack>
                          <Image
                            src={previewUrl}
                            alt="Picture preview"
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              Selected picture
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {selectedFile?.name}
                            </Text>
                          </VStack>
                        </HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={handleRemoveFile}
                        >
                          <BiTrash />
                        </Button>
                      </HStack>
                    </Box>
                  )}

                  {/* Upload area */}
                  <Box
                    border="2px dashed"
                    borderColor={dragActive ? "blue.400" : "gray.300"}
                    borderRadius="md"
                    p={6}
                    textAlign="center"
                    cursor="pointer"
                    bg={dragActive ? "blue.50" : "gray.50"}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('addFileInput')?.click()}
                  >
                    <VStack gap={2}>
                      <BiUpload size={24} color={dragActive ? "#3182ce" : "#9ca3af"} />
                      <Text fontSize="sm" color="gray.600">
                        Click to upload or drag and drop
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Max size: 10MB
                      </Text>
                      {uploadConfig?.allowed_extensions && (
                        <Text fontSize="xs" color="gray.500">
                          Supported: {uploadConfig.allowed_extensions
                            .filter(ext => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
                            .join(', ')
                          }
                        </Text>
                      )}
                    </VStack>
                  </Box>

                  {/* Hidden file input */}
                  <input
                    id="addFileInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: "none" }}
                  />
                </VStack>
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
            loading={createServiceTypeMutation.isPending}
          >
            Create Service Type
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// EditServiceType component
function EditServiceType({ 
  serviceType,
  onUpdate,
  onClose
}: { 
  serviceType: ServiceTypePublic
  onUpdate: (serviceType: ServiceTypePublic) => void
  onClose: () => void
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(serviceType.picture_url || null)
  const [formData, setFormData] = useState({
    name: serviceType.name,
    description: serviceType.description || "",
    is_active: serviceType.is_active,
  })

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Get upload config
  const { data: uploadConfig } = useQuery({
    queryKey: ["files", "config"],
    queryFn: () => FilesService.getUploadConfig(),
  })

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => FilesService.uploadFile({
      formData: {
        file,
        folder: "service-types",
        public_read: true,
      },
    }),
  })

  // Mutation for updating service type
  const updateServiceTypeMutation = useMutation({
    mutationFn: (data: { id: string; updateData: any }) => 
      ServiceTypesService.updateServiceType({ 
        id: data.id, 
        requestBody: data.updateData 
      }),
    onSuccess: (data) => {
      // Invalidate and refetch service types
      queryClient.invalidateQueries({ queryKey: ["serviceTypes"] })
      // Update local state for immediate UI update
      onUpdate(data)
      // Close modal
      onClose()
      showSuccessToast("Service type updated successfully")
    },
    onError: (error) => {
      console.error("Error updating service type:", error)
      showErrorToast("Failed to update service type. Please try again.")
    }
  })

  const validateFile = (file: File): string | null => {
    // Check size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return "Please select an image file"
    }

    // Check extension if we have config
    if (uploadConfig?.allowed_extensions) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const imageExtensions = uploadConfig.allowed_extensions.filter(ext => 
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
      )
      if (extension && !imageExtensions.includes(extension)) {
        return `File type not allowed. Allowed types: ${imageExtensions.join(', ')}`
      }
    }

    return null
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const error = validateFile(file)
    
    if (error) {
      showErrorToast(error)
      return
    }

    setSelectedFile(file)
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      showErrorToast("Please enter a service type name")
      return
    }
    
    try {
      let pictureUrl = previewUrl
      
      // Upload new file if selected
      if (selectedFile) {
        const uploadResult = await uploadFileMutation.mutateAsync(selectedFile)
        pictureUrl = uploadResult.file_url
      }

      // Create update data for API
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        picture_url: pictureUrl,
        is_active: formData.is_active,
      }

      // Use mutation to update service type
      updateServiceTypeMutation.mutate({ 
        id: serviceType.id, 
        updateData 
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      showErrorToast("Failed to upload picture. Please try again.")
    }
  }

  return (
    <DialogRoot
      open={true}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service Type</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service type name"
                  type="text"
                  required
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter service type description (optional)"
                  rows={3}
                />
              </Field>

              <Field label="Picture">
                <VStack gap={3} align="stretch">
                  {/* Preview display */}
                  {previewUrl && (
                    <Box
                      p={3}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <HStack justify="space-between">
                        <HStack>
                          <Image
                            src={previewUrl}
                            alt="Picture preview"
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {selectedFile ? "New picture" : "Current picture"}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {selectedFile?.name || "Existing picture"}
                            </Text>
                          </VStack>
                        </HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={handleRemoveFile}
                        >
                          <BiTrash />
                        </Button>
                      </HStack>
                    </Box>
                  )}

                  {/* Upload area */}
                  <Box
                    border="2px dashed"
                    borderColor={dragActive ? "blue.400" : "gray.300"}
                    borderRadius="md"
                    p={6}
                    textAlign="center"
                    cursor="pointer"
                    bg={dragActive ? "blue.50" : "gray.50"}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('editFileInput')?.click()}
                  >
                    <VStack gap={2}>
                      <BiUpload size={24} color={dragActive ? "#3182ce" : "#9ca3af"} />
                      <Text fontSize="sm" color="gray.600">
                        Click to upload or drag and drop
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Max size: 10MB
                      </Text>
                      {uploadConfig?.allowed_extensions && (
                        <Text fontSize="xs" color="gray.500">
                          Supported: {uploadConfig.allowed_extensions
                            .filter(ext => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
                            .join(', ')
                          }
                        </Text>
                      )}
                    </VStack>
                  </Box>

                  {/* Hidden file input */}
                  <input
                    id="editFileInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: "none" }}
                  />
                </VStack>
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
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={updateServiceTypeMutation.isPending}
          >
            Update Service Type
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// DeleteServiceType component
function DeleteServiceType({ 
  serviceType,
  onDelete,
  onClose
}: { 
  serviceType: ServiceTypePublic
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  // Mutation for deleting service type
  const deleteServiceTypeMutation = useMutation({
    mutationFn: (id: string) => ServiceTypesService.deleteServiceType({ id }),
    onSuccess: () => {
      // Invalidate and refetch service types
      queryClient.invalidateQueries({ queryKey: ["serviceTypes"] })
      // Update local state for immediate UI update
      onDelete(serviceType.id)
      // Close modal
      onClose()
    },
    onError: (error) => {
      console.error("Error deleting service type:", error)
      alert("Failed to delete service type. Please try again.")
    }
  })

  const handleDelete = () => {
    deleteServiceTypeMutation.mutate(serviceType.id)
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
          <DialogTitle>Delete Service Type</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete the service type "{serviceType.name}"? 
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
            loading={deleteServiceTypeMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

function ServiceTypes() {
  // Fetch service types from API
  const { 
    data: serviceTypesResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: () => ServiceTypesService.readServiceTypes(),
  })

  // Extract service types array from API response
  const serviceTypes = serviceTypesResponse?.data || []

  const [editingServiceType, setEditingServiceType] = useState<ServiceTypePublic | null>(null)
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceTypePublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Function to add new service type (for immediate UI updates)
  const handleAddServiceType = (_newServiceType: ServiceTypePublic) => {
    // This will be handled by React Query cache invalidation
    refetch()
  }

  // Function to update service type (for immediate UI updates)
  const handleUpdateServiceType = (_updatedServiceType: ServiceTypePublic) => {
    // This will be handled by React Query cache invalidation in the edit component
    refetch()
  }

  // Function to delete service type (for immediate UI updates)
  const handleDeleteServiceType = (_id: string) => {
    // This will be handled by React Query cache invalidation in the delete component
    refetch()
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text>Loading service types...</Text>
        </VStack>
      </Container>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="stretch">
          <Text color="red.500">Error loading service types. Please try again.</Text>
          <Button onClick={() => refetch()}>Retry</Button>
        </VStack>
      </Container>
    )
  }

  // Filter service types based on search term
  const filteredServiceTypes = serviceTypes.filter((serviceType: ServiceTypePublic) =>
    serviceType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (serviceType.description && serviceType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <Container maxW="full">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="lg">Service Types</Heading>
            <Text color="gray.500">Manage service types and their configurations</Text>
          </VStack>
          <AddServiceType onAdd={handleAddServiceType} />
        </HStack>

        {/* Search */}
        <HStack>
          <Input
            placeholder="Search service types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="400px"
          />
          <Button variant="outline">
            <FiSearch />
          </Button>
        </HStack>

        {filteredServiceTypes.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No service types found</EmptyState.Title>
                <EmptyState.Description>
                  {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first service type."}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Picture</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredServiceTypes.map((serviceType) => (
                <Table.Row key={serviceType.id}>
                  <Table.Cell>
                    {serviceType.picture_url ? (
                      <Image
                        src={serviceType.picture_url}
                        alt={serviceType.name}
                        boxSize="40px"
                        objectFit="cover"
                        borderRadius="md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <FiImage size={40} color="gray" />
                    )}
                  </Table.Cell>
                  <Table.Cell fontWeight="medium">
                    {serviceType.name}
                  </Table.Cell>
                  <Table.Cell>
                    <Text truncate maxW="300px">
                      {serviceType.description || "No description"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      variant={serviceType.is_active ? "solid" : "subtle"}
                      colorScheme={serviceType.is_active ? "green" : "gray"}
                    >
                      {serviceType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="gray.500">
                      {serviceType.created_at ? new Date(serviceType.created_at).toLocaleDateString() : "N/A"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingServiceType(serviceType)}
                      >
                        <FiEdit />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        onClick={() => setDeletingServiceType(serviceType)}
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
      {editingServiceType && (
        <EditServiceType
          serviceType={editingServiceType}
          onUpdate={handleUpdateServiceType}
          onClose={() => setEditingServiceType(null)}
        />
      )}

      {/* Delete Modal */}
      {deletingServiceType && (
        <DeleteServiceType
          serviceType={deletingServiceType}
          onDelete={handleDeleteServiceType}
          onClose={() => setDeletingServiceType(null)}
        />
      )}
    </Container>
  )
}

export const Route = createFileRoute("/_layout/service-types")({
  component: ServiceTypes,
})
