import { Button, MenuContent, MenuItem, MenuRoot, MenuTrigger, Box } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash2 } from "react-icons/fi"
import { useState } from "react"

import UpdateUserRole from "./UpdateUserRole"
import RemoveUserFromBranch from "./RemoveUserFromBranch"

interface BranchUserActionsMenuProps {
  branchId: string
  userId: string
  currentRole: string
  userName?: string
  branchName?: string
}

export const BranchUserActionsMenu = ({
  branchId,
  userId,
  currentRole,
  userName,
  branchName,
}: BranchUserActionsMenuProps) => {
  const [showUpdateRole, setShowUpdateRole] = useState(false)
  const [showRemoveUser, setShowRemoveUser] = useState(false)

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <BsThreeDotsVertical fontSize="16px" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem
            value="update-role"
            gap={2}
            py={2}
            onClick={() => setShowUpdateRole(true)}
            style={{ cursor: "pointer" }}
          >
            <FiEdit fontSize="16px" />
            <Box flex="1">Update Role</Box>
          </MenuItem>
          <MenuItem
            value="remove-user"
            gap={2}
            py={2}
            onClick={() => setShowRemoveUser(true)}
            style={{ cursor: "pointer" }}
          >
            <FiTrash2 fontSize="16px" />
            <Box flex="1">Remove User</Box>
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      {showUpdateRole && (
        <UpdateUserRole
          branchId={branchId}
          userId={userId}
          currentRole={currentRole}
          userName={userName}
          branchName={branchName}
        />
      )}

      {showRemoveUser && (
        <RemoveUserFromBranch
          branchId={branchId}
          userId={userId}
          userName={userName}
          branchName={branchName}
        />
      )}
    </>
  )
}

export default BranchUserActionsMenu
