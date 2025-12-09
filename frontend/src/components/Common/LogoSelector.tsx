import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  VStack,
  HStack,
  Button,
  Image,
  Text,
  Box,
} from "@chakra-ui/react"
import { BiUpload, BiTrash } from "react-icons/bi"
import { FilesService } from "../../client"
import { Field } from "../ui/field"

interface LogoSelectorProps {
  label?: string
  accept?: string
  maxSizeBytes?: number
  selectedFile?: File | null
  onFileSelect?: (file: File | null) => void
  required?: boolean
  errorText?: string
  disabled?: boolean
  placeholder?: string
}

const LogoSelector = ({
  label = "Company Logo",
  accept = "image/*",
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  selectedFile,
  onFileSelect,
  required = false,
  errorText,
  disabled = false,
  placeholder = "Click to upload or drag and drop",
}: LogoSelectorProps) => {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get file upload config
  const { data: uploadConfig } = useQuery({
    queryKey: ["files", "config"],
    queryFn: () => FilesService.getUploadConfig(),
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
      alert(error) // Replace with proper toast
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    onFileSelect?.(file)
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
    onFileSelect?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Field
      required={required}
      invalid={!!errorText}
      errorText={errorText}
      label={label}
    >
      <VStack gap={3} align="stretch">
        {/* Preview display */}
        {(selectedFile || previewUrl) && (
          <Box
            p={3}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="gray.50"
          >
            <HStack justify="space-between">
              <HStack>
                {previewUrl && (
                  <Image
                    src={previewUrl}
                    alt="Logo preview"
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                )}
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    Selected logo
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
                onClick={handleRemove}
                disabled={disabled}
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
            <BiUpload size={24} color={dragActive ? "#3182ce" : "#9ca3af"} />
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          style={{ display: "none" }}
          disabled={disabled}
        />
      </VStack>
    </Field>
  )
}

export default LogoSelector
