import { useState } from "react"
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

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Checkbox } from "../ui/checkbox"

interface DepartmentPublic {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
  created_by: string
}

interface EditDepartmentProps {
  department: DepartmentPublic
  isOpen: boolean
  onClose: () => void
}

const EditDepartment = ({ department, isOpen, onClose }: EditDepartmentProps) => {
  const [formData, setFormData] = useState({
    name: department.name,
    description: department.description || "",
    is_active: department.is_active,
    branch_id: department.branch_id,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual submission logic with DepartmentsService
    console.log("Updated department data:", formData)
    onClose()
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  type="text"
                  required
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter department description (optional)"
                  rows={3}
                />
              </Field>

              <Field label="Branch ID" required>
                <Input
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  placeholder="Enter branch ID"
                  type="text"
                  required
                />
              </Field>

              <Field>
                <HStack>
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(details) => 
                      setFormData({ ...formData, is_active: !!details.checked })
                    }
                  />
                  <Text>Active</Text>
                </HStack>
              </Field>
            </VStack>
          </form>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button variant="solid" onClick={handleSubmit}>
            Update
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditDepartment
