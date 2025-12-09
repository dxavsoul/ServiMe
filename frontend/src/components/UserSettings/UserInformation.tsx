import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Badge,
  Separator,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type UserUpdateMe,
  UsersService,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"
import { Field } from "../ui/field"
import { 
  useCurrentUserProfile, 
  useUserApprovalStatus 
} from "../../hooks/useEnhancedUsers"

interface ExtendedUserForm extends UserUpdateMe {
  department?: string
  position?: string
  phone?: string
}

const UserInformation = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()
  
  // Enhanced user data hooks
  const { data: enhancedProfile } = useCurrentUserProfile()
  const { data: approvalStatus } = useUserApprovalStatus()
  
  // Use enhanced profile data if available, fallback to current user
  const userToDisplay = enhancedProfile || currentUser
  
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<ExtendedUserForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: userToDisplay?.full_name || "",
      email: userToDisplay?.email || "",
      department: (userToDisplay as any)?.department || (userToDisplay as any)?.profile?.department || "",
      position: (userToDisplay as any)?.position || (userToDisplay as any)?.profile?.position || "",
      phone: (userToDisplay as any)?.phone || (userToDisplay as any)?.profile?.phone || "",
    },
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: async (data: ExtendedUserForm) => {
      // Always use the standard user update service for now
      return UsersService.updateUserMe({ 
        requestBody: {
          full_name: data.full_name || undefined,
          email: data.email,
        }
      })
    },
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
      setEditMode(false)
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const onSubmit: SubmitHandler<ExtendedUserForm> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="sm" py={4}>
          User Information
        </Heading>
        
        {/* User Status Banner */}
        {approvalStatus && (
          <VStack mb={6} gap={3}>
            <Flex w="full" p={4} bg={approvalStatus.approved ? "green.50" : "orange.50"} borderRadius="md">
              <VStack align="start" gap={2} w="full">
                <HStack>
                  <Badge colorScheme={approvalStatus.is_superuser ? "purple" : approvalStatus.approved ? "green" : "orange"}>
                    {approvalStatus.is_superuser ? "SuperAdmin" : approvalStatus.approved ? "Approved" : "Pending Approval"}
                  </Badge>
                  {userToDisplay?.is_active && (
                    <Badge colorScheme="green">Active</Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color={approvalStatus.approved ? "green.700" : "orange.700"}>
                  {approvalStatus.message}
                </Text>
                {approvalStatus.approved && !approvalStatus.is_superuser && (
                  <Text fontSize="xs" color="gray.600">
                    Access to {approvalStatus.total_companies_access} companies and {approvalStatus.total_branches_access} branches
                  </Text>
                )}
              </VStack>
            </Flex>
          </VStack>
        )}

        {/* User Details Form */}
        <Box
          w={{ sm: "full", md: "lg" }}
          as="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <VStack gap={4} align="stretch">
            {/* Basic Information */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Basic Information
              </Text>
              
              <VStack gap={4} align="stretch">
                <Field label="Full name">
                  {editMode ? (
                    <Input
                      {...register("full_name", { maxLength: 30 })}
                      type="text"
                      size="md"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <Text
                      fontSize="md"
                      py={2}
                      color={!userToDisplay?.full_name ? "gray.500" : "inherit"}
                      truncate
                      maxW="sm"
                    >
                      {userToDisplay?.full_name || "Not provided"}
                    </Text>
                  )}
                </Field>

                <Field
                  label="Email"
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  {editMode ? (
                    <Input
                      {...register("email", {
                        required: "Email is required",
                        pattern: emailPattern,
                      })}
                      type="email"
                      size="md"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <Text fontSize="md" py={2} truncate maxW="sm">
                      {userToDisplay?.email}
                    </Text>
                  )}
                </Field>
              </VStack>
            </Box>

            <Separator />

            {/* Profile Information */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Profile Information
              </Text>
              
              <VStack gap={4} align="stretch">
                <Field label="Department">
                  {editMode ? (
                    <Input
                      {...register("department")}
                      type="text"
                      size="md"
                      placeholder="Enter your department"
                    />
                  ) : (
                    <Text
                      fontSize="md"
                      py={2}
                      color={!(userToDisplay as any)?.department && !(userToDisplay as any)?.profile?.department ? "gray.500" : "inherit"}
                      truncate
                      maxW="sm"
                    >
                      {(userToDisplay as any)?.department || (userToDisplay as any)?.profile?.department || "Not provided"}
                    </Text>
                  )}
                </Field>

                <Field label="Position">
                  {editMode ? (
                    <Input
                      {...register("position")}
                      type="text"
                      size="md"
                      placeholder="Enter your position"
                    />
                  ) : (
                    <Text
                      fontSize="md"
                      py={2}
                      color={!(userToDisplay as any)?.position && !(userToDisplay as any)?.profile?.position ? "gray.500" : "inherit"}
                      truncate
                      maxW="sm"
                    >
                      {(userToDisplay as any)?.position || (userToDisplay as any)?.profile?.position || "Not provided"}
                    </Text>
                  )}
                </Field>

                <Field label="Phone">
                  {editMode ? (
                    <Input
                      {...register("phone")}
                      type="tel"
                      size="md"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <Text
                      fontSize="md"
                      py={2}
                      color={!(userToDisplay as any)?.phone && !(userToDisplay as any)?.profile?.phone ? "gray.500" : "inherit"}
                      truncate
                      maxW="sm"
                    >
                      {(userToDisplay as any)?.phone || (userToDisplay as any)?.profile?.phone || "Not provided"}
                    </Text>
                  )}
                </Field>
              </VStack>
            </Box>

            <Separator />

            {/* Account Information */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Account Information
              </Text>
              
              <VStack gap={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Account Type:</Text>
                  <Badge colorScheme={userToDisplay?.is_superuser ? "purple" : "blue"}>
                    {userToDisplay?.is_superuser ? "SuperAdmin" : "User"}
                  </Badge>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Status:</Text>
                  <Badge colorScheme={userToDisplay?.is_active ? "green" : "red"}>
                    {userToDisplay?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </HStack>

                {(userToDisplay as any)?.created_at && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Member since:</Text>
                    <Text fontSize="sm">
                      {new Date((userToDisplay as any).created_at).toLocaleDateString()}
                    </Text>
                  </HStack>
                )}

                {(userToDisplay as any)?.last_login && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Last login:</Text>
                    <Text fontSize="sm">
                      {new Date((userToDisplay as any).last_login).toLocaleDateString()}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <Flex mt={6} gap={3}>
              <Button
                colorScheme="blue"
                onClick={editMode ? handleSubmit(onSubmit) : toggleEditMode}
                type="button"
                loading={isSubmitting}
                disabled={editMode && (!isDirty || !getValues("email"))}
              >
                {editMode ? "Save Changes" : "Edit Profile"}
              </Button>
              {editMode && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </Flex>
          </VStack>
        </Box>
      </Container>
    </>
  )
}

export default UserInformation
