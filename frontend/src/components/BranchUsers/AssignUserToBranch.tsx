import {
  Button,
  VStack,
  Text,
  Box,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useState } from "react"

import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { BranchUsersService } from "../../client/branch-users-service"
import { UsersService } from "../../client"
import type { BranchUserAssign } from "../../client/branch-users"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface AssignUserToBranchProps {
  branchId: string
  branchName?: string
}

const AssignUserToBranch = ({ branchId, branchName }: AssignUserToBranchProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<BranchUserAssign>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      user_id: "",
      role: "",
      is_company_owner: false,
      company_role: "",
      company_access_level: "",
    },
  })

  // Fetch users for the dropdown
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => UsersService.readUsers({ skip: 0, limit: 100 }),
  })

  const mutation = useMutation({
    mutationFn: (data: BranchUserAssign) =>
      BranchUsersService.assignUser({
        branch_id: branchId,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("User assigned to branch successfully!")
      reset()
      setIsOpen(false)
      queryClient.invalidateQueries({
        queryKey: ["branch-users", branchId],
      })
    },
    onError: (err) => {
      handleError(err as any)
    },
  })

  const onSubmit: SubmitHandler<BranchUserAssign> = (data) => {
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
        <Button variant="outline" size="sm">
          Assign User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Assign User to Branch</DialogTitle>
            {branchName && <p>Branch: {branchName}</p>}
          </DialogHeader>
          <DialogBody>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.user_id}
                errorText={errors.user_id?.message}
                label="User"
              >
                <select
                  id="user_id"
                  {...register("user_id", {
                    required: "Please select a user.",
                  })}
                  disabled={isLoadingUsers}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select a user...</option>
                  {users?.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                required
                invalid={!!errors.role}
                errorText={errors.role?.message}
                label="Role"
              >
                <select
                  id="role"
                  {...register("role", {
                    required: "Please select a role.",
                  })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select a role...</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              <Field
                invalid={!!errors.company_role}
                errorText={errors.company_role?.message}
                label="Company Role (Optional)"
              >
                <select
                  id="company_role"
                  {...register("company_role")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select company role...</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="employee">Employee</option>
                </select>
              </Field>

              <Field
                invalid={!!errors.company_access_level}
                errorText={errors.company_access_level?.message}
                label="Company Access Level (Optional)"
              >
                <select
                  id="company_access_level"
                  {...register("company_access_level")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select access level...</option>
                  <option value="all_branches">All Branches</option>
                  <option value="single_branch">Single Branch</option>
                  <option value="limited">Limited</option>
                  <option value="regional">Regional</option>
                </select>
              </Field>

              <Field label="Is Company Owner">
                <Box display="flex" alignItems="center" gap={2}>
                  <input
                    type="checkbox"
                    id="is_company_owner"
                    {...register("is_company_owner")}
                    style={{
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <Text fontSize="sm" color="gray.600">
                    Mark this user as a company owner
                  </Text>
                </Box>
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
              Assign User
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AssignUserToBranch
