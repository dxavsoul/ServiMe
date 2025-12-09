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
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { BiEdit } from "react-icons/bi"

import { type CategoryUpdate, type CategoryPublic, CategoriesService } from "../../client"
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

interface EditCategoryProps {
  category: CategoryPublic
}

const EditCategory = ({ category }: EditCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CategoryUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      code: "",
      is_active: true,
      requires_business_license: false,
      requires_tax_id: false,
      requires_professional_license: false,
      requires_incorporation_docs: false,
      requires_personal_id: false,
      min_employees: 0,
      max_employees: 0,
      sort_order: 0,
    },
  })

  // Update form values when category prop changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name || "",
        description: category.description || "",
        code: category.code || "",
        is_active: category.is_active ?? true,
        requires_business_license: category.requires_business_license ?? false,
        requires_tax_id: category.requires_tax_id ?? false,
        requires_professional_license: category.requires_professional_license ?? false,
        requires_incorporation_docs: category.requires_incorporation_docs ?? false,
        requires_personal_id: category.requires_personal_id ?? false,
        min_employees: category.min_employees ?? 0,
        max_employees: category.max_employees ?? 0,
        sort_order: category.sort_order ?? 0,
      })
    }
  }, [category, reset])

  const mutation = useMutation({
    mutationFn: (data: CategoryUpdate) =>
      CategoriesService.updateCategory({ 
        id: category.id, 
        requestBody: data
      }),
    onSuccess: () => {
      showSuccessToast("Category updated successfully.")
      setIsOpen(false)
    },
    onError: (err: any) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const onSubmit: SubmitHandler<CategoryUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "xl" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BiEdit />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the category information below.</Text>
            <VStack gap={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                <GridItem>
                  <Field
                    required
                    invalid={!!errors.name}
                    errorText={errors.name?.message}
                    label="Category Name"
                  >
                    <Input
                      id="name"
                      {...register("name", {
                        required: "Category name is required.",
                      })}
                      placeholder="Small Business"
                      type="text"
                    />
                  </Field>
                </GridItem>

                <GridItem>
                  <Field
                    required
                    invalid={!!errors.code}
                    errorText={errors.code?.message}
                    label="Category Code"
                  >
                    <Input
                      id="code"
                      {...register("code", {
                        required: "Category code is required.",
                      })}
                      placeholder="SMALL_BIZ"
                      type="text"
                    />
                  </Field>
                </GridItem>
              </Grid>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Small businesses with limited employees"
                  resize="vertical"
                  minH="80px"
                />
              </Field>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                <GridItem>
                  <Field
                    invalid={!!errors.min_employees}
                    errorText={errors.min_employees?.message}
                    label="Minimum Employees"
                  >
                    <Input
                      id="min_employees"
                      {...register("min_employees", {
                        valueAsNumber: true,
                        min: { value: 0, message: "Must be 0 or greater" }
                      })}
                      placeholder="0"
                      type="number"
                      min="0"
                    />
                  </Field>
                </GridItem>

                <GridItem>
                  <Field
                    invalid={!!errors.max_employees}
                    errorText={errors.max_employees?.message}
                    label="Maximum Employees"
                  >
                    <Input
                      id="max_employees"
                      {...register("max_employees", {
                        valueAsNumber: true,
                        min: { value: 0, message: "Must be 0 or greater" }
                      })}
                      placeholder="50"
                      type="number"
                      min="0"
                    />
                  </Field>
                </GridItem>
              </Grid>

              <Field
                invalid={!!errors.sort_order}
                errorText={errors.sort_order?.message}
                label="Sort Order"
              >
                <Input
                  id="sort_order"
                  {...register("sort_order", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Must be 0 or greater" }
                  })}
                  placeholder="0"
                  type="number"
                  min="0"
                />
              </Field>

              <Text fontSize="sm" fontWeight="medium" mt={4}>Document Requirements</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={2} w="100%">
                <GridItem>
                  <Field label="Business License">
                    <input
                      id="requires_business_license"
                      {...register("requires_business_license")}
                      type="checkbox"
                    />
                    <Text ml={2} display="inline" fontSize="sm">Required</Text>
                  </Field>
                </GridItem>

                <GridItem>
                  <Field label="Tax ID">
                    <input
                      id="requires_tax_id"
                      {...register("requires_tax_id")}
                      type="checkbox"
                    />
                    <Text ml={2} display="inline" fontSize="sm">Required</Text>
                  </Field>
                </GridItem>

                <GridItem>
                  <Field label="Professional License">
                    <input
                      id="requires_professional_license"
                      {...register("requires_professional_license")}
                      type="checkbox"
                    />
                    <Text ml={2} display="inline" fontSize="sm">Required</Text>
                  </Field>
                </GridItem>

                <GridItem>
                  <Field label="Incorporation Docs">
                    <input
                      id="requires_incorporation_docs"
                      {...register("requires_incorporation_docs")}
                      type="checkbox"
                    />
                    <Text ml={2} display="inline" fontSize="sm">Required</Text>
                  </Field>
                </GridItem>

                <GridItem>
                  <Field label="Personal ID">
                    <input
                      id="requires_personal_id"
                      {...register("requires_personal_id")}
                      type="checkbox"
                    />
                    <Text ml={2} display="inline" fontSize="sm">Required</Text>
                  </Field>
                </GridItem>
              </Grid>

              <Field label="Active Status">
                <input
                  id="is_active"
                  {...register("is_active")}
                  type="checkbox"
                />
                <Text ml={2} display="inline">Category is active</Text>
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

export default EditCategory