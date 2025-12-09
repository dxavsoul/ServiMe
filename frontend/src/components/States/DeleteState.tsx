import {
  Button,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { StatesService, type StateWithCountryPublic } from "../../client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogActionTrigger,
} from "../ui/dialog"

interface DeleteStateProps {
  state: StateWithCountryPublic
  onDelete: (id: string) => void
  onClose: () => void
}

export function DeleteState({ state, onDelete, onClose }: DeleteStateProps) {
  const queryClient = useQueryClient()

  const deleteStateMutation = useMutation({
    mutationFn: (state_id: string) => 
      StatesService.deleteState({ state_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["states"] })
      onDelete(state.id)
      onClose()
    },
    onError: (error) => {
      console.error("Error deleting state:", error)
      alert("Failed to delete state. Please try again.")
    }
  })

  const handleDelete = () => {
    deleteStateMutation.mutate(state.id)
  }

  return (
    <DialogRoot
      open={true}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "sm" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete State</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete the state "{state.name}" ({state.code}) 
            in {state.country?.name}? This action cannot be undone and may affect related cities.
          </Text>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            colorScheme="red" 
            onClick={handleDelete}
            loading={deleteStateMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
