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
import { useState, useEffect } from "react"
import { BiEdit } from "react-icons/bi"

import { type IndustryTypeUpdate, type IndustryTypePublic, IndustryTypesService } from "../../client"
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

interface EditIndustryTypeProps {
  industryType: IndustryTypePublic
}

const EditIndustryType = ({ industryType }: EditIndustryTypeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IndustryTypeUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      code: "",
      is_active: true,
    },
  })

  // Update form values when industryType prop changes
  useEffect(() => {
    if (industryType) {
      reset({
        name: industryType.name || "",
        description: industryType.description || "",
        code: industryType.code || "",
        is_active: industryType.is_active ?? true,
      })
    }
  }, [industryType, reset])

  const mutation = useMutation({
    mutationFn: (data: IndustryTypeUpdate) =>
      IndustryTypesService.updateIndustryType({ 
        id: industryType.id, 
        requestBody: data
      }),
    onSuccess: () => {
      showSuccessToast("Industry type updated successfully.")
      setIsOpen(false)
    },
    onError: (err: any) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["industry-types"] })
    },
  })

  const onSubmit: SubmitHandler<IndustryTypeUpdate> = (data) => {
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
        <Button variant="ghost" size="sm">
          <BiEdit />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Industry Type</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the industry type information below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Industry Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Industry name is required.",
                  })}
                  placeholder="Technology"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.code}
                errorText={errors.code?.message}
                label="Industry Code"
              >
                <Input
                  id="code"
                  {...register("code", {
                    required: "Industry code is required.",
                  })}
                  placeholder="TECH"
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
                  placeholder="Technology-related industries"
                  resize="vertical"
                  minH="80px"
                />
              </Field>

              <Field
                label="Active Status"
              >
                <input
                  id="is_active"
                  {...register("is_active")}
                  type="checkbox"
                />
                <Text ml={2} display="inline">Industry type is active</Text>
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

export default EditIndustryType