import { HStack } from "@chakra-ui/react"
import { type IndustryTypePublic } from "../../client"
import EditIndustryType from "./EditIndustryType"
import DeleteIndustryType from "./DeleteIndustryType"

interface IndustryTypeActionsMenuProps {
  industryType: IndustryTypePublic
}

export const IndustryTypeActionsMenu = ({ industryType }: IndustryTypeActionsMenuProps) => {
  return (
    <HStack gap={1}>
      <EditIndustryType industryType={industryType} />
      <DeleteIndustryType industryType={industryType} />
    </HStack>
  )
}