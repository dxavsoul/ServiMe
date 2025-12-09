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
import { BiUpload, BiTrash, BiImage } from "react-icons/bi"
import { FilesService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { Field } from "../ui/field"

interface FileUploadProps {
  label?: string
  accept?: string
  maxSizeBytes?: number
  currentFileKey?: string | null
  currentFileUrl?: string | null
  onFileUpload?: (fileKey: string, fileUrl: string) => void
  onFileDelete?: () => void
  required?: boolean
  errorText?: string
  disabled?: boolean
  placeholder?: string
  folder?: string
  publicRead?: boolean
}

const FileUpload = ({
  label = "File Upload",
  accept = "image/*",
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  currentFileKey,
  currentFileUrl,
  onFileUpload,
  onFileDelete,
  required = false,
  errorText,
  disabled = false,
  placeholder = "Click to upload or drag and drop",
  folder = "uploads",
  publicRead = false,
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()

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
          public_read: publicRead,
        },
      })
    },
    onSuccess: (data) => {
      showSuccessToast("File uploaded successfully")
      onFileUpload?.(data.file_key, data.file_url)
    },
    onError: (error: any) => {
      showErrorToast(`Upload failed: ${error.message || "Unknown error"}`)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileKey: string) => FilesService.deleteFile({ file_key: fileKey }),
    onSuccess: () => {
      showSuccessToast("File deleted successfully")
      onFileDelete?.()
    },
    onError: (error: any) => {
      showErrorToast(`Delete failed: ${error.message || "Unknown error"}`)
    },
  })

  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
    }

    // Check extension if we have config
    if (uploadConfig?.allowed_extensions && accept === "image/*") {
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

  const handleDelete = () => {
    if (currentFileKey) {
      deleteMutation.mutate(currentFileKey)
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
        {/* Current file display */}
        {currentFileUrl && (
          <Box
            p={3}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="gray.50"
          >
            <HStack justify="space-between">
              <HStack>
                {accept === "image/*" ? (
                  <Image
                    src={currentFileUrl}
                    alt="Current file"
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <BiImage size={50} />
                )}
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    Current file
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {currentFileKey?.split('/').pop()}
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleDelete}
                loading={deleteMutation.isPending}
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
            {uploadConfig?.allowed_extensions && accept === "image/*" && (
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
              Uploading file...
            </Text>
          </Box>
        )}

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

export default FileUpload
