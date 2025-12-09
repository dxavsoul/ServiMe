import { HStack } from "@chakra-ui/react"
import { type CategoryPublic } from "../../client"
import EditCategory from "./EditCategory"
import DeleteCategory from "./DeleteCategory"

interface CategoryActionsMenuProps {
  category: CategoryPublic
}

export const CategoryActionsMenu = ({ category }: CategoryActionsMenuProps) => {
  return (
    <HStack gap={1}>
      <EditCategory category={category} />
      <DeleteCategory category={category} />
    </HStack>
  )
}