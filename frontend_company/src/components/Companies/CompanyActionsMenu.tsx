import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { CompanyPublic } from "@/client"
import DeleteCompany from "./DeleteCompany"
import EditCompany from "./EditCompany"

interface CompanyActionsMenuProps {
  company: CompanyPublic
}

export const CompanyActionsMenu = ({ company }: CompanyActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditCompany company={company} />
        <DeleteCompany company={company} />
      </MenuContent>
    </MenuRoot>
  )
}
