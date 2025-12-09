import {
  Button,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { BranchUsersService } from "../../client/branch-users-service"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface RemoveUserFromBranchProps {
  branchId: string
  userId: string
  userName?: string
  branchName?: string
}

const RemoveUserFromBranch = ({ 
  branchId, 
  userId, 
  userName, 
  branchName 
}: RemoveUserFromBranchProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () =>
      BranchUsersService.removeUser({
        branch_id: branchId,
        user_id: userId,
      }),
    onSuccess: (response) => {
      showSuccessToast(response.message || "User removed from branch successfully!")
      setIsOpen(false)
      queryClient.invalidateQueries({
        queryKey: ["branch-users", branchId],
      })
    },
    onError: (err) => {
      handleError(err as any)
    },
  })

  const handleRemove = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" colorPalette="red">
          Remove User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User from Branch</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            Are you sure you want to remove {userName ? `"${userName}"` : "this user"} 
            from {branchName ? `"${branchName}"` : "this branch"}?
          </p>
          <p style={{ marginTop: "8px", color: "#666" }}>
            This action cannot be undone. The user will lose access to this branch.
          </p>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="red"
            onClick={handleRemove}
            loading={mutation.isPending}
          >
            Remove User
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default RemoveUserFromBranch
