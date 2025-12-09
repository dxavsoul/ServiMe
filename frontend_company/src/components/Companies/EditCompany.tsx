import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  Textarea,
  HStack,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { BiEdit } from "react-icons/bi"

import { type CompanyUpdate, type CompanyPublic, CompaniesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import LocationSelector from "../Common/LocationSelector"
import CompanyLogoUpload from "../Common/CompanyLogoUpload"

interface EditCompanyProps {
  company: CompanyPublic
}

const EditCompany = ({ company }: EditCompanyProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [countryId, setCountryId] = useState<string | null>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [cityId, setCityId] = useState<string | null>(company.city_id || null)
  
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CompanyUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      industry: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      city_id: "",
      is_active: true,
    },
  })

  // Update form values when company prop changes
  useEffect(() => {
    if (company) {
      reset({
        name: company.name || "",
        description: company.description || "",
        industry: company.industry || "",
        website: company.website || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        city_id: company.city_id || "",
        is_active: company.is_active ?? true,
      })
    }
  }, [company, reset])

  const mutation = useMutation({
    mutationFn: (data: CompanyUpdate) =>
      CompaniesService.updateCompany({ 
        company_id: company.id, 
        requestBody: { ...data, city_id: cityId }
      }),
    onSuccess: () => {
      showSuccessToast("Company updated successfully.")
      setIsOpen(false)
    },
    onError: (err: any) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] })
    },
  })

  const onSubmit: SubmitHandler<CompanyUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="xs">
          <BiEdit fontSize="16px" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the company details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Company Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Company name is required.",
                  })}
                  placeholder="Tech Corp"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="A technology company"
                  resize="vertical"
                  minH="80px"
                />
              </Field>

              <Field
                invalid={!!errors.industry}
                errorText={errors.industry?.message}
                label="Industry"
              >
                <Input
                  id="industry"
                  {...register("industry")}
                  placeholder="Technology"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.website}
                errorText={errors.website?.message}
                label="Website"
              >
                <Input
                  id="website"
                  {...register("website", {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: "Please enter a valid URL (starting with http:// or https://)"
                    }
                  })}
                  placeholder="https://techcorp.com"
                  type="url"
                />
              </Field>

              <Field
                invalid={!!errors.email}
                errorText={errors.email?.message}
                label="Email"
              >
                <Input
                  id="email"
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address"
                    }
                  })}
                  placeholder="contact@techcorp.com"
                  type="email"
                />
              </Field>

              <Field
                invalid={!!errors.phone}
                errorText={errors.phone?.message}
                label="Phone"
              >
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+1234567890"
                  type="tel"
                />
              </Field>

              <Field
                invalid={!!errors.address}
                errorText={errors.address?.message}
                label="Address"
              >
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="123 Tech Street"
                  type="text"
                />
              </Field>

              {/* Location Selector */}
              <LocationSelector
                countryId={countryId}
                stateId={stateId}
                cityId={cityId}
                onCountryChange={setCountryId}
                onStateChange={setStateId}
                onCityChange={setCityId}
              />

              {/* Company Logo Upload */}
              <CompanyLogoUpload
                company={company}
                onLogoUpdate={() => {
                  // Refresh the companies list when logo changes
                  queryClient.invalidateQueries({ queryKey: ["companies"] })
                }}
              />

              <Field label="Active Status">
                <HStack>
                  <input
                    id="is_active"
                    {...register("is_active")}
                    type="checkbox"
                  />
                  <Text ml={2}>Company is active</Text>
                </HStack>
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Update
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditCompany
