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
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import { 
  type CompanyCreate, 
  CompaniesService,
  FilesService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
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
import LogoSelector from "../Common/LogoSelector"
import IndustrySelector from "../Common/IndustrySelector"
import CategorySelector from "../Common/CategorySelector"

const AddCompany = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [cityId, setCityId] = useState<string | null>(null)
  const [industryTypeId, setIndustryTypeId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CompanyCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      industry_type_id: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      city_id: "",
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: CompanyCreate) => {
      // First create the company
      const company = await CompaniesService.createCompany({ 
        requestBody: { ...data, city_id: cityId, industry_type_id: industryTypeId, category_id: categoryId } 
      })
      
      // If logo file is provided, upload it
      if (logoFile && company.id) {
        setIsUploadingLogo(true)
        try {
          await FilesService.uploadCompanyLogo({
            company_id: company.id,
            formData: { file: logoFile }
          })
        } catch (error) {
          console.warn("Logo upload failed:", error)
          // Don't fail the entire operation if logo upload fails
        } finally {
          setIsUploadingLogo(false)
        }
      }
      
      return company
    },
    onSuccess: () => {
      const message = logoFile 
        ? "Company created and logo uploaded successfully!" 
        : "Company created successfully!"
      showSuccessToast(message)
      reset()
      setCityId(null)
      setIndustryTypeId(null)
      setCategoryId(null)
      setLogoFile(null)
      setIsOpen(false)
    },
    onError: (err: any) => {
      handleError(err)
      setIsUploadingLogo(false)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] })
    },
  })

  const onSubmit: SubmitHandler<CompanyCreate> = (data) => {
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
        <Button value="add-company" my={4}>
          <FaPlus fontSize="16px" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new company.</Text>
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

              {/* Industry Selection */}
              <IndustrySelector
                industryTypeId={industryTypeId}
                onIndustryChange={setIndustryTypeId}
                errorText={errors.industry_type_id?.message}
              />

              {/* Category Selection */}
              <CategorySelector
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
                errorText={errors.category_id?.message}
              />

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

              {/* Location Selection */}
              <LocationSelector
                countryId={null}
                stateId={null}
                cityId={cityId}
                onCountryChange={() => {}} // We only care about city selection
                onStateChange={() => {}} // We only care about city selection
                onCityChange={setCityId}
              />

              {/* Company Logo Upload */}
              <LogoSelector
                label="Company Logo"
                selectedFile={logoFile}
                onFileSelect={setLogoFile}
                placeholder="Upload company logo (optional)"
              />

              <Field
                label="Active Status"
              >
                <input
                  id="is_active"
                  {...register("is_active")}
                  type="checkbox"
                  defaultChecked={true}
                />
                <Text ml={2} display="inline">Company is active</Text>
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting || isUploadingLogo}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting || isUploadingLogo}
            >
              {isUploadingLogo ? "Uploading Logo..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddCompany
