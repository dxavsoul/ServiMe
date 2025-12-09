import { Button, Text } from "@chakra-ui/react"

import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"

interface DepartmentPublic {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
  created_by: string
}

interface DeleteDepartmentProps {
  department: DepartmentPublic
  isOpen: boolean
  onClose: () => void
}

const DeleteDepartment = ({ department, isOpen, onClose }: DeleteDepartmentProps) => {
  const handleDelete = () => {
    // TODO: Implement actual deletion logic with DepartmentsService
    console.log("Deleting department:", department.id)
    onClose()
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      size={{ base: "xs", md: "md" }}
      placement="center"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete the department "{department.name}"? 
            This action cannot be undone.
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
            colorPalette="red"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteDepartment
