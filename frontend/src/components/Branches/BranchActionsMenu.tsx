import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { BranchPublic } from "@/client"
import DeleteBranch from "./DeleteBranch"
import EditBranch from "./EditBranch"
import ManageBranchUsers from "../BranchUsers/ManageBranchUsers"

interface BranchActionsMenuProps {
  branch: BranchPublic
}

export const BranchActionsMenu = ({ branch }: BranchActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <ManageBranchUsers branchId={branch.id} branchName={branch.name} />
        <EditBranch branch={branch} />
        <DeleteBranch branch={branch} />
      </MenuContent>
    </MenuRoot>
  )
}
