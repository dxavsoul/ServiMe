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
import { FaPlus } from "react-icons/fa"

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
import { Checkbox } from "../ui/checkbox"

const AddDepartment = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    branch_id: "123e4567-e89b-12d3-a456-426614174000", // Default branch for demo
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual submission logic with DepartmentsService
    console.log("Department data:", formData)
    setIsOpen(false)
    // Reset form
    setFormData({
      name: "",
      description: "",
      is_active: true,
      branch_id: "123e4567-e89b-12d3-a456-426614174000",
    })
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogTrigger asChild>
        <Button>
          <FaPlus fontSize="16px" />
          Add Department
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
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
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button variant="solid" onClick={handleSubmit}>
            Create
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddDepartment
