import { useEffect } from "react"
import {
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Box,
} from "@chakra-ui/react"
import { Field } from "@/components/ui/field"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"

import type { CustomerPublic, CustomerUpdate } from "@/client"
import { CustomersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "../ui/checkbox"

interface EditCustomerProps {
  customer: CustomerPublic
  isOpen: boolean
  onClose: () => void
}

interface CustomerEditForm extends Omit<CustomerUpdate, 'password'> {
  password?: string
}

function EditCustomer({ customer, isOpen, onClose }: EditCustomerProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<CustomerEditForm>({
    defaultValues: {
      email: customer.email || "",
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "",
      postal_code: customer.postal_code || "",
      latitude: customer.latitude || undefined,
      longitude: customer.longitude || undefined,
      is_active: customer.is_active ?? true,
    },
  })

  // Reset form when customer changes
  useEffect(() => {
    reset({
      email: customer.email || "",
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "",
      postal_code: customer.postal_code || "",
      latitude: customer.latitude || undefined,
      longitude: customer.longitude || undefined,
      is_active: customer.is_active ?? true,
    })
  }, [customer, reset])

  const mutation = useMutation({
    mutationFn: (data: CustomerUpdate) =>
      CustomersService.updateCustomer({
        customer_id: customer.id,
        requestBody: data,
      }),
    onSuccess: (updatedCustomer) => {
      showSuccessToast(`Customer "${updatedCustomer.full_name}" updated successfully`)
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] })
      onClose()
    },
    onError: (error: any) => {
      showErrorToast(
        `Failed to update customer: ${error.message || "Unknown error"}`
      )
    },
  })

  const onSubmit: SubmitHandler<CustomerEditForm> = async (data) => {
    // Remove empty optional fields and password if not provided
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (key === 'password' && (!value || value.trim() === '')) {
        // Skip empty password
        return acc
      }
      if (value !== "" && value !== null && value !== undefined) {
        acc[key as keyof CustomerUpdate] = value
      }
      return acc
    }, {} as Partial<CustomerUpdate>) as CustomerUpdate

    mutation.mutate(cleanData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <DialogContent maxW="2xl">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <VStack gap={4} alignItems="stretch">
              {/* Basic Information */}
              <Box>
                <Text fontWeight="semibold" mb={3} color="gray.700">
                  Basic Information
                </Text>
                <VStack gap={3} alignItems="stretch">
                  <Field label="Full Name *" invalid={!!errors.full_name} errorText={errors.full_name?.message}>
                    <Input
                      id="full_name"
                      placeholder="Enter customer's full name"
                      {...register("full_name", {
                        required: "Full name is required",
                        minLength: { value: 1, message: "Full name cannot be empty" },
                        maxLength: { value: 255, message: "Full name is too long" },
                      })}
                    />
                  </Field>

                  <Field label="Email Address *" invalid={!!errors.email} errorText={errors.email?.message}>
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                  </Field>

                  <Field label="New Password (leave blank to keep current)" invalid={!!errors.password} errorText={errors.password?.message}>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password or leave blank"
                      {...register("password", {
                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                        maxLength: { value: 40, message: "Password is too long" },
                      })}
                    />
                  </Field>

                  <Field label="Phone Number" invalid={!!errors.phone} errorText={errors.phone?.message}>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1-555-0123"
                      {...register("phone", {
                        maxLength: { value: 20, message: "Phone number is too long" },
                      })}
                    />
                  </Field>
                </VStack>
              </Box>

              {/* Address Information */}
              <Box>
                <Text fontWeight="semibold" mb={3} color="gray.700">
                  Address Information
                </Text>
                <VStack gap={3} alignItems="stretch">
                  <Field label="Street Address">
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      {...register("address", {
                        maxLength: { value: 255, message: "Address is too long" },
                      })}
                    />
                  </Field>

                  <HStack gap={3}>
                    <Field label="City" flex={1}>
                      <Input
                        id="city"
                        placeholder="New York"
                        {...register("city", {
                          maxLength: { value: 100, message: "City name is too long" },
                        })}
                      />
                    </Field>
                    <Field label="State/Province" flex={1}>
                      <Input
                        id="state"
                        placeholder="NY"
                        {...register("state", {
                          maxLength: { value: 100, message: "State name is too long" },
                        })}
                      />
                    </Field>
                  </HStack>

                  <HStack gap={3}>
                    <Field label="Country" flex={1}>
                      <Input
                        id="country"
                        placeholder="USA"
                        {...register("country", {
                          maxLength: { value: 100, message: "Country name is too long" },
                        })}
                      />
                    </Field>
                    <Field label="Postal Code" flex={1}>
                      <Input
                        id="postal_code"
                        placeholder="10001"
                        {...register("postal_code", {
                          maxLength: { value: 20, message: "Postal code is too long" },
                        })}
                      />
                    </Field>
                  </HStack>
                </VStack>
              </Box>

              {/* Location Coordinates */}
              <Box>
                <Text fontWeight="semibold" mb={3} color="gray.700">
                  Location Coordinates (Optional)
                </Text>
                <HStack gap={3}>
                  <Field label="Latitude" flex={1}>
                    <Input
                      type="number"
                      id="latitude"
                      placeholder="40.7128"
                      min={-90}
                      max={90}
                      step={0.000001}
                      {...register("latitude", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="Longitude" flex={1}>
                    <Input
                      type="number"
                      id="longitude"
                      placeholder="-74.0060"
                      min={-180}
                      max={180}
                      step={0.000001}
                      {...register("longitude", { valueAsNumber: true })}
                    />
                  </Field>
                </HStack>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enter precise coordinates for location-based features
                </Text>
              </Box>

              {/* Account Status */}
              <Box>
                <Text fontWeight="semibold" mb={3} color="gray.700">
                  Account Settings
                </Text>
                <Checkbox
                  {...register("is_active")}
                >
                  Active Account
                </Checkbox>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Inactive accounts cannot access the system
                </Text>
              </Box>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              type="submit"
              colorScheme="blue"
              loading={isSubmitting || mutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditCustomer
