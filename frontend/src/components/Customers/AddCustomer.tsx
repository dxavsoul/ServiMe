import { useState } from "react"
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

import type { CustomerCreate } from "@/client"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "../ui/checkbox"

interface AddCustomerProps {
  children: React.ReactNode
}

interface CustomerForm extends CustomerCreate {}

function AddCustomer({ children }: AddCustomerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<CustomerForm>({
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      latitude: undefined,
      longitude: undefined,
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CustomerCreate) =>
      CustomersService.createCustomer({ requestBody: data }),
    onSuccess: (newCustomer) => {
      showSuccessToast(`Customer "${newCustomer.full_name}" created successfully`)
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] })
      setIsOpen(false)
      reset()
    },
    onError: (error: any) => {
      showErrorToast(
        `Failed to create customer: ${error.message || "Unknown error"}`
      )
    },
  })

  const onSubmit: SubmitHandler<CustomerForm> = async (data) => {
    // Remove empty optional fields
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        acc[key as keyof CustomerCreate] = value
      }
      return acc
    }, {} as Partial<CustomerCreate>) as CustomerCreate

    mutation.mutate(cleanData)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent maxW="2xl">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
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

                  <Field label="Password *" invalid={!!errors.password} errorText={errors.password?.message}>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter secure password"
                      {...register("password", {
                        required: "Password is required",
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
                  defaultChecked={true}
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
              Create Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddCustomer
