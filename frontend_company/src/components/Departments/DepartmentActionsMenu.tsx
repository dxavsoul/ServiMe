import { Button, Text } from "@chakra-ui/react"
import { useState } from "react"
import { BiDotsVertical, BiEdit, BiTrash } from "react-icons/bi"

// Use local type definition for now
interface DepartmentPublic {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
  created_by: string
}

import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "../ui/menu"
import EditDepartment from "./EditDepartment"
import DeleteDepartment from "./DeleteDepartment"

interface DepartmentActionsMenuProps {
  department: DepartmentPublic
}

export const DepartmentActionsMenu = ({ department }: DepartmentActionsMenuProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <BiDotsVertical fontSize="16px" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem 
            value="edit"
            gap={2}
            onClick={() => setIsEditOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <BiEdit fontSize="16px" />
            <Text>Edit</Text>
          </MenuItem>
          <MenuItem 
            value="delete"
            gap={2}
            onClick={() => setIsDeleteOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <BiTrash fontSize="16px" />
            <Text>Delete</Text>
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <EditDepartment 
        department={department}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      
      <DeleteDepartment 
        department={department}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}
