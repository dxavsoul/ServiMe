import { useState, useRef } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  VStack,
  HStack,
  Button,
  Image,
  Text,
  Box,
} from "@chakra-ui/react"
import { BiTrash, BiImage } from "react-icons/bi"
import { FilesService } from "../../client"
import { Field } from "../ui/field"

interface ImageUploadProps {
  label?: string
  currentImageUrl?: string | null
  onImageUpload?: (imageUrl: string) => void
  onImageRemove?: () => void
  required?: boolean
  errorText?: string
  disabled?: boolean
  placeholder?: string
  maxSizeBytes?: number
  folder?: string
}

const ImageUpload = ({
  label = "Image",
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  required = false,
  errorText,
  disabled = false,
  placeholder = "Click to upload or drag and drop",
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  folder = "services", // Default folder for service images
}: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get file upload config
  const { data: uploadConfig } = useQuery({
    queryKey: ["files", "config"],
    queryFn: () => FilesService.getUploadConfig(),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      return FilesService.uploadFile({
        formData: { 
          file, 
          folder,
          public_read: true // Make service images publicly readable
        },
      })
    },
    onSuccess: (response) => {
      setPreviewUrl(null) // Clear preview since we now have the actual URL
      onImageUpload?.(response.file_url)
    },
    onError: (error: any) => {
      console.error("Image upload failed:", error)
      alert(`Upload failed: ${error.message || "Unknown error"}`)
      setPreviewUrl(null)
    },
  })

  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
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
      alert(error)
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Start upload
    uploadMutation.mutate(file)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onImageRemove?.()
  }

  const displayUrl = previewUrl || currentImageUrl

  return (
    <Field
      required={required}
      invalid={!!errorText}
      errorText={errorText}
      label={label}
    >
      <VStack gap={3} align="stretch">
        {/* Current image display */}
        {displayUrl && (
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
                  src={displayUrl}
                  alt="Service image"
                  boxSize="80px"
                  objectFit="cover"
                  borderRadius="md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    {previewUrl ? "Uploading..." : "Current image"}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {previewUrl ? "Preview" : "Click to change"}
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleRemove}
                disabled={disabled || uploadMutation.isPending}
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
          cursor={disabled ? "not-allowed" : "pointer"}
          bg={dragActive ? "blue.50" : "gray.50"}
          opacity={disabled ? 0.6 : 1}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={disabled ? undefined : openFileDialog}
        >
          <VStack gap={2}>
            <BiImage size={24} color={dragActive ? "#3182ce" : "#9ca3af"} />
            <Text fontSize="sm" color="gray.600">
              {placeholder}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Max size: {Math.round(maxSizeBytes / 1024 / 1024)}MB
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

        {/* Loading indicator */}
        {uploadMutation.isPending && (
          <Box p={2} bg="blue.50" borderRadius="md">
            <Text fontSize="sm" color="blue.600" textAlign="center">
              Uploading image...
            </Text>
          </Box>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: "none" }}
          disabled={disabled}
        />
      </VStack>
    </Field>
  )
}

export default ImageUpload
